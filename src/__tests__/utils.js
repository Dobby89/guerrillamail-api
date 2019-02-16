import {
	getMostRecentEmail,
	filterNewEmails,
	syncLocalEmails
} from '../utils';

describe('getMostRecentEmail()', () => {
	it('should return false when passed an empty array', () => {
		expect(getMostRecentEmail([])).toBe(false);
	});
	it('should return false when passed anything but an array', () => {
		expect(getMostRecentEmail('foo')).toBe(false);
	});
	it('should return the last element from an array', () => {
		const result = getMostRecentEmail(['foo', 'bar']);
		expect(result).toBe('bar');
	});
});

describe('filterNewEmails()', () => {
	it('should return the second params array if the first params array has no length', () => {
		expect(filterNewEmails([], ['foo', 'bar'])).toEqual(['foo', 'bar']);
	});
	it('should return an empty array if the mail_id of old emails matches the new emails', () => {
		const oldEmails = [{
			mail_id: 10
		}];
		const newEmails = [{
			mail_id: 10
		}];
		expect(filterNewEmails(oldEmails, newEmails)).toEqual([]);
	});
	it('should return only new emails if their email_id is different to old emails', () => {
		const oldEmails = [{
			mail_id: 10
		}];
		const newEmails = [{
			mail_id: 15
		}];
		expect(filterNewEmails(oldEmails, newEmails)).toEqual([{
			mail_id: 15
		}]);

		const oldEmails2 = [{
			mail_id: 10
		}];
		const newEmails2 = [{
			mail_id: 10
		}, {
			mail_id: 15
		}];
		expect(filterNewEmails(oldEmails2, newEmails2)).toEqual([{
			mail_id: 15
		}]);
	});
});

describe('syncLocalEmails()', () => {
	it('should return an empty array if localEmails is an empty array', () => {
		expect(syncLocalEmails([], [])).toEqual([]);
		expect(syncLocalEmails([], ['foo'])).toEqual([]);
	});
	it('should return an empty array if mail_id of localEmails matches given emailIds param', () => {
		const localEmails = [{
			mail_id: 10
		}];
		const result = syncLocalEmails(localEmails, [10]);
		expect(result).toEqual([]);
	});
	it('should return an array of localEmails which do not have the same mail_id as given emailIds param', () => {
		const localEmails = [{
			mail_id: 10
		}];
		const result = syncLocalEmails(localEmails, [55]);
		expect(result).toEqual([{
			mail_id: 10
		}]);

		const localEmails2 = [{
			mail_id: 10
		}, {
			mail_id: 16
		}];
		const result2 = syncLocalEmails(localEmails2, [10]);
		expect(result2).toEqual([{
			mail_id: 16
		}]);
	});
});
