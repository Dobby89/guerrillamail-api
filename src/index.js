const axios = require('axios');
const SetIntervalPlus = require('setinterval-plus');
const EventEmitter = require('eventemitter3');

const baseUrl = 'https://api.guerrillamail.com/ajax.php';
const eventStrings = {
	set_email_user: 'emailAddress',
	get_email_address: 'emailAddress',
	newEmail: 'newEmail',
	pollRequestStart: 'pollRequestStart',
	pollRequestComplete: 'pollRequestComplete',
	pollRequestError: 'pollRequestError',
}
const defaultConfig = {
	username: false,
	pollInterval: 20000
}

function partiallyApply(fn, ...initialArgs) {
	return function partiallyApplied (...laterArgs) {
		return fn(...initialArgs, ...laterArgs);
	}
}

function getMostRecentEmail(emailList) {
	if (emailList.length) {
		return emailList[emailList.length - 1];
	}
	return false;
}

function filterNewEmails(oldEmails, possibleNewEmails) {
	if (!oldEmails.length) {
		// We don't have any old emails, so all of them must be new
		return possibleNewEmails;
	}

	const oldEmailIds = oldEmails.map(email => email.mail_id);
	return possibleNewEmails.filter(newEmail => !oldEmailIds.includes(newEmail.mail_id));
}

function syncLocalEmails(localEmails, emailIds) {
	return localEmails.filter(email => !emailIds.includes(email.mail_id));
}

// Guerrilla API Docs: https://docs.google.com/document/d/1Qw5KQP1j57BPTDmms5nspe-QAjNEsNg8cQHpAAycYNM/edit?hl=en
class Guerrilla extends EventEmitter {
	constructor(config = {}) {
		super();

		this.config = {
			...defaultConfig,
			...config
		}
		this.sidToken = false;
		this.emailAddress = false;
		// Polling vars
		this.isPolling = false;
		this.isPaused = false;
		this.clock = false;
		this.emailsReceived = [];

		this.on(eventStrings.set_email_user, result => {
			this.emailAddress = result.email_addr;
		});

		if (this.config.username && typeof this.config.username === 'string') {
			this.setEmailUser({ email_user: this.config.username });
		} else {
			this.getEmailAddress();
		}
	}

	_request(params = {}) {
		const customEventString = eventStrings[params.f];

		if (this.sidToken) {
			params.sid_token = this.sidToken;
		}

		return new Promise((resolve, reject) => {
			axios.get(baseUrl, { params: { ...params } })
				.then(response => {
					if (response.data.sid_token) {
						this.sidToken = response.data.sid_token;
					}
					if (params.f === 'forget_me' && response.data === true) {
						this.sid_token = false;
					}

					if (params.f === 'del_email' && response.deleted_ids && Array.isArray(response.deleted_ids)) {
						// Delete our local emails so we're in sync with the server
						this.emailsReceived = syncLocalEmails(this.emailsReceived, response.deleted_ids);
					}

					// Emit the appropriate event for the API call if required
					if (customEventString) {
						this.emit(customEventString, response.data);
					}

					resolve(response.data);
				})
				.catch((error) => {
					if (customEventString) {
						this.emit(`${customEventString}Error`, error);
					}

					reject(error);
				});
		});
	}

	_initPoll() {
		if (this.clock === false) {
			if (this.config.pollInterval && typeof this.config.pollInterval === 'number') {
				// Now we have an email address assigned, begin polling for new emails
				this._pollEmails();

				// Poll again every X milliseconds
				this.clock = new SetIntervalPlus(this._pollEmails.bind(this), this.config.pollInterval);
			}
		}
	}

	_pollEmails() {
		// Check for emails received since the most recent email's ID.
		const mostRecentEmail = getMostRecentEmail(this.emailsReceived);

		/**
		 * Store reference to the appropriate API method based on whether
		 * we have access to the most recent email ID or not.
		 * The API docs recommend using one method for initial call
		 * and another once you have a recent email ID
		 */
		const pollingMethod = mostRecentEmail ? partiallyApply(this.checkEmail.bind(this), { seq: mostRecentEmail.email_id }) : this.getEmailList.bind(this);

		if (!this.isPolling && !this.isPaused) {
			this.isPolling = true;

			this.emit(eventStrings.pollRequestStart, true);

			pollingMethod().then(response => {
				this.isPolling = false;

				this.emit(eventStrings.pollRequestComplete, true);

				if (response.count) {
					const newEmails = filterNewEmails(this.emailsReceived, response.list);

					if (newEmails.length) {
						this.emailsReceived = this.emailsReceived.concat(newEmails);

						this.emit(eventStrings.newEmail, newEmails);
					}
				}
			}).catch(error => {
				this.emit(eventStrings.pollRequestError, error);
			});
		}
	}

	pollStart() {
		if (this.clock) {
			this.clock.start();
		} else {
			if (this.emailAddress) {
				// We have an email address registered, so we can poll
				this._initPoll();
			} else {
				console.warn(`Cannot start polling yet - an email address has not been registered with the API. Please wait until the '${eventStrings.set_email_user}' event has been emitted and try again.`);
			}
		}
	}

	pollStop() {
		if (this.clock) {
			this.isPaused = true;
			this.clock.pause();
		}
	}

	pollPlay() {
		if (this.clock && this.isPaused) {
			this.clock.resume();
			this.isPaused = false;
		}
	}

	pollPause() {
		if (this.clock && !this.isPaused) {
			this.isPaused = true;
			this.clock.pause();
		}
	}

	pollDestroy() {
		if (this.clock) {
			this.clock.stop();
			this.clock = false;
			this.isPaused = false;
			this.isPolling = false;
			this.emailsReceived = [];
		}
	}

	setEmailUser(params = {}) {
		const options = {
			f: 'set_email_user'
		};

		if (params.email_user) {
			options.email_user = params.email_user;
		}
		if (params.lang) {
			options.lang = params.lang;
		}
		if (params.site) {
			options.site = params.site;
		}

		return this._request(options);
	}

	getEmailAddress(params = {}) {
		const options = {
			f: 'get_email_address'
		};

		if (params.site) {
			options.site = params.site;
		}

		return this._request(options);
	}

	getEmailList(params = {}) {
		const options = {
			f: 'get_email_list',
			offset: 0
		};

		if (typeof params.offset === 'number') {
			options.offset = params.offset;
		}
		if (typeof params.seq === 'number') {
			options.seq = params.seq;
		}

		return this._request(options);
	}

	getOlderList(params = {}) {
		const options = {
			f: 'get_older_list',
		}

		if (typeof params.seq === 'number') {
			options.seq = params.seq;
		}
		if (typeof params.limit === 'number') {
			options.limit = params.limit;
		}

		return this._request(options);
	}

	checkEmail(params = {}) {
		const options = {
			f: 'check_email',
		};

		if (typeof params.seq === 'number') {
			options.seq = params.seq;
		}

		return this._request(options);
	}

	fetchEmail(emailId) {
		const options = {
			f: 'fetch_email',
		}

		if (typeof emailId === 'number') {
			options.email_id = emailId;
		}

		return this._request(options);
	}

	forgetMe() {
		const options = {
			f: 'forget_me',
			email_addr: this.emailAddress
		}

		return this._request(options);
	}

	delEmail(...emailIds) {
		const options = {
			f: 'del_email',
		}

		/**
		 * API expects email IDs as an array format, e.g. email_ids[]=425&email_ids[]=426&email_ids[]=427
		 * where 425, 426 and 427 are the ids of emails to delete.
		 *
		 * Axios kindly formats arrays as described here: https://github.com/axios/axios/issues/1443
		 * so we just have to send it as an array. Easy peasy!
		 */
		options.email_ids = [...emailIds];

		return this._request(options);
	}

	destroy() {
		this.pollDestroy();
		this.forgetMe();
		this.emailsReceived = [];
	}
}

module.exports = Guerrilla;