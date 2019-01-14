[api docs]: https://docs.google.com/document/d/1Qw5KQP1j57BPTDmms5nspe-QAjNEsNg8cQHpAAycYNM/edit?hl=en
[event emitter]: https://github.com/primus/eventemitter3

# Guerrilla Mail API Wrapper

A Promise-based Javascript wrapper for the [Guerrillamail API](https://www.guerrillamail.com/GuerrillaMailAPI.html).



## Features

- Interval polling with built-in `start`, `stop`, `play`, `pause` and destroy methods, using [setinterval-plus](https://www.npmjs.com/package/setinterval-plus)
- Promise-based, using [Axios](https://www.npmjs.com/package/axios)
- Event emitter, using [EventEmitter3][event emitter]



## Installation

```
npm install guerrillamail-api
```


## Usage

```.js
import GuerrillaMailApi from 'guerrillamail-api';

const GuerrillaApi = new GuerrillaMailApi();

// Wait for the API to assign an email address by listening for the `emailAddress` event
GuerrillaApi.on('emailAddress', result => {
    GuerrillaApi.pollStart(); // Begin polling for new emails
});

// Wait for the `newEmail` event to be emitted
GuerrillaApi.on('newEmail', result => {
    // You got mail!
});
```



## Config

Pass config options when instantiating the wrapper.

### Config reference table

| Config Property | Type | Default | Description |
| - | - | - | - |
| `emailUser` | Boolean\|String | `false` | Connect to a particular inbox, otherwise the API will assign you a random inbox. |
| `pollInterval` | Number | `20000` | How often (in milliseconds) to poll for new emails. |

### Example

```.js
const GuerrillaApi = new GuerrillaMailApi({
    emailUser: 'sampleusr'
    pollInterval: 15000
});
```


## Methods

### Guerrilla API Methods

Methods for the API endpoints from the official [API documentation][api docs].

**Important:** Do not pass an `sid_token` to any methods. Guerrilla Mail API Wrapper will take care of this internally.

#### getEmailAddress([config])

Register a new random email address with the API.

API function: [`get_email_address`][api docs].

```.js
GuerrillaApi.getEmailAddress().then(result => {
    // ...
});
```

#### setEmailUser([config])

Register a custom email user with the API.

API function: [`set_email_user`][api docs].

```.js
GuerrillaApi.setEmailUser({
    email_user: 'sampleusr'
}).then(result => {
    // ...
});
```

#### getEmailList([config])

Get a maximum of 20 messages from the specified offset.

API function: [`get_email_list`][api docs].

```.js
GuerrillaApi.getEmailList({
    offset: 0
}).then(result => {
    // ...
});
```

#### getOlderList([config])

Get emails that are older (lower ID) than the given email ID (where `seq` is the ID).

API function: [`get_older_list`][api docs].

```.js
GuerrillaApi.getOlderList({
    seq: 815
}).then(result => {
    // ...
});
```

#### checkEmail([config])

API function: [`check_email`][api docs].

Check for new email on the server.

```.js
GuerrillaApi.checkEmail({
    seq: 456
}).then(result => {
    // ...
});
```

#### fetchEmail(emailId)

API function: [`fetch_email`][api docs].

Get the contents of an email by ID.

```.js
GuerrillaApi.fetchEmail(789).then(result => {
    // ...
});
```

#### forgetMe()

Forget the current registered email address.

API function: [`forget_me`][api docs].

```.js
GuerrillaApi.forgetMe().then(result => {
    // ...
});
```

#### delEmail(emailId1 [, ...[, emailIdN]])

Delete the emails from the server by ID.

API function: [`del_email`][api docs].

```.js
GuerrillaApi.delEmail(123, 456, 789).then(result => {
    // ...
});
```

### Polling Methods

Methods for controlling the polling interval.

#### pollStart()

Start polling for new emails every _x_ milliseconds, as defined by [`pollInterval`](#config-reference-table).

See [event examples](#event-examples) of how to react when new emails are received.

```.js
GuerrillaApi.pollStart();
```

#### pollStop()

Stop polling for new emails.

```.js
GuerrillaApi.pollStop();
```

#### pollPlay()

Resume polling for new emails.

```.js
GuerrillaApi.pollPlay();
```

#### pollPause()

Pause polling for new emails.

```.js
GuerrillaApi.pollPause();
```

#### pollDestroy()

Destroy the poller.

```.js
GuerrillaApi.pollDestroy();
```

### Misc Methods

#### destroy()

Destroy the poller and make the API forget the current email address (like you were never here!).

```.js
GuerrillaApi.destroy();
```

### Event Methods

Guerrilla Mail API Wrapper extends [EventEmitter3][event emitter] which means you have access to an `.on()` method. This is useful for listening for events, such as when a new email is received, or when the email address has been assigned by the API.

See full list of emitted events in the [event reference table](#event-reference-table).

#### on(eventString, data)

```.js
GuerrillaApi.on('newEmail', newEmails => {
    // Do stuff with the new emails
});
```



## Events

Event strings are emitted in certain situations, which can be listened for using the `.on()` method.

### Event examples:

```.js
GuerrillaApi.on('emailAddress', emailAddressDetails => {
    GuerrillaApi.pollStart(); // Start polling for new emails
});

GuerrillaApi.on('emailAddressError', error => {
    // Email address wasn't assigned
});

GuerrillaApi.on('newEmail', newEmails => {
    // You got mail!
});
```

### Event reference table

| Event string | Emission reason  |
| - | - |
| `emailAddress` | An email address has been assigned by the API. |
| `emailAddressError` | An email user or address request errors. |
| `newEmail` | New email has been received. |
| `pollRequestStart` | A poll request is attempted. |
| `pollRequestComplete` | A poll request has been completed. |
| `pollRequestError` | A poll request has an error. |



## Todo

- Write tests
- Add option for callbacks instead of promises