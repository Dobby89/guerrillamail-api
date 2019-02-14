[api docs]: https://docs.google.com/document/d/1Qw5KQP1j57BPTDmms5nspe-QAjNEsNg8cQHpAAycYNM/edit?hl=en
[event emitter]: https://github.com/primus/eventemitter3

# Guerrilla Mail API Wrapper

A Promise-based Javascript wrapper for the [Guerrillamail API](https://www.guerrillamail.com/GuerrillaMailAPI.html).



## Features

- Interval polling with built-in **start**, **stop**, **play**, **pause** methods, using [setinterval-plus](https://www.npmjs.com/package/setinterval-plus)
- Promise-based, using [Axios](https://www.npmjs.com/package/axios)
- Event emitter, using [EventEmitter3][event emitter]



## Installation

```
npm install guerrillamail-api
```


## Usage

**Important:** Once you instantiate the class, you must wait for the API to register a random email address. This is still the case, even if you are using a [custom email address](#custom-email-address).

The class will emit the `emailAddress` event when an email address has been successfully registered with the API. Read more about the available [event methods](#event-methods).

```javascript
import GuerrillaMailApi from 'guerrillamail-api';

const GuerrillaApi = new GuerrillaMailApi();

GuerrillaApi.on('emailAddress', result => {
    GuerrillaApi.getEmailList().then(result => {
        // ...
    });
});
```


### Custom email address

It is possible to connect to a specific inbox by setting `emailUser` in the config object when you instantiate the class. See [config](#config) section.

```javascript
const GuerrillaApi = new GuerrillaMailApi({
    emailUser: 'sampleusr'
});
```


### Polling

Use [`pollStart()`](#pollstart) to start polling the inbox for new emails.

As with all methods which interact with the API, you must call the `pollStart()` method **after** the API has registered an email address.

```javascript
GuerrillaApi.on('emailAddress', result => {
    // Begin polling for new emails after the email address has been registered
    GuerrillaApi.pollStart();
});
```

Wait for the poller to emit the `newEmail` event:

```javascript
GuerrillaApi.on('newEmail', result => {
    // You got mail!
});
```

#### Tips
 - Control the frequency of polling by setting [`pollInterval`](#config-reference-table) when you instantiate the class.
 - It is possible to [play](#pollplay), [pause](#pollpause) and [stop](#pollstop) polling for emails. See [polling methods](#polling-methods).


## Config

Pass config options when instantiating the wrapper.

### Config reference table

| Config Property | Type | Default | Description |
| - | - | - | - |
| `emailUser` | Boolean\|String | `false` | Connect to a specific inbox, otherwise the API will assign you a random inbox. |
| `pollInterval` | Number | `20000` | How often (in milliseconds) to poll for new emails. |

### Example

```javascript
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

```javascript
GuerrillaApi.getEmailAddress().then(result => {
    // ...
});
```

#### setEmailUser([config])

Register a custom email user with the API.

API function: [`set_email_user`][api docs].

```javascript
GuerrillaApi.setEmailUser({
    email_user: 'sampleusr'
}).then(result => {
    // ...
});
```

#### getEmailList([config])

Get a maximum of 20 messages from the specified offset.

API function: [`get_email_list`][api docs].

```javascript
GuerrillaApi.getEmailList({
    offset: 0
}).then(result => {
    // ...
});
```

#### getOlderList([config])

Get emails that are older (lower ID) than the given email ID (where `seq` is the ID).

API function: [`get_older_list`][api docs].

```javascript
GuerrillaApi.getOlderList({
    seq: 815
}).then(result => {
    // ...
});
```

#### checkEmail([config])

API function: [`check_email`][api docs].

Check for new email on the server.

```javascript
GuerrillaApi.checkEmail({
    seq: 456
}).then(result => {
    // ...
});
```

#### fetchEmail(emailId)

API function: [`fetch_email`][api docs].

Get the contents of an email by ID.

```javascript
GuerrillaApi.fetchEmail(789).then(result => {
    // ...
});
```

#### forgetMe()

Forget the current registered email address.

API function: [`forget_me`][api docs].

```javascript
GuerrillaApi.forgetMe().then(result => {
    // ...
});
```

#### delEmail(emailId1 [, ...[, emailIdN]])

Delete the emails from the server by ID.

API function: [`del_email`][api docs].

```javascript
GuerrillaApi.delEmail(123, 456, 789).then(result => {
    // ...
});
```

### Polling Methods

Methods for controlling the polling interval.

#### pollStart()

Start polling for new emails every _x_ milliseconds, as defined by [`pollInterval`](#config-reference-table).

See [event examples](#event-examples) of how to react when new emails are received.

```javascript
GuerrillaApi.pollStart();
```

#### pollStop()

Stop polling for new emails.

```javascript
GuerrillaApi.pollStop();
```

#### pollPlay()

Resume polling for new emails.

```javascript
GuerrillaApi.pollPlay();
```

#### pollPause()

Pause polling for new emails.

```javascript
GuerrillaApi.pollPause();
```

#### pollDestroy()

Destroy the poller.

```javascript
GuerrillaApi.pollDestroy();
```

### Misc Methods

#### destroy()

Destroy the poller and make the API forget the current email address (like you were never here!).

```javascript
GuerrillaApi.destroy();
```

### Event Methods

Guerrilla Mail API Wrapper extends [EventEmitter3][event emitter] which means you have access to an `.on()` method. This is useful for listening for events, such as when a new email is received, or when the email address has been assigned by the API.

See full list of emitted events in the [event reference table](#event-reference-table).

#### on(eventString, data)

```javascript
GuerrillaApi.on('newEmail', newEmails => {
    // Do stuff with the new emails
});
```



## Events

Event strings are emitted in certain situations, which can be listened for using the `.on()` method.

**Important:** The key event to listen for is `emailAddress`. This means the API has registered the inbox and is ready.

### Event examples:

```javascript
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