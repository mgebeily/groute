## Motivation
I needed a simple client-side router for a vanilla JavaScript project I'm writing. I like having as many of my dependencies be my own as possible. I'm also familiar with (and partial to) Angular's routing syntax.

## Installation

`yarn add groute`

or

`npm install groute`

## Usage

```
import { groute } from 'groute';

groute([{
	path: '/',
	onActivate: () => {
		console.log("The current URL is (or starts with) '/'");
	},
	matchContent: `
		<h1>This is a master route.</h1>
		<div id="master-outlet"></div>
	`,
	matchOutlet: '#master-outlet',
	children: [{
		path: 'users',
		onActivate: () => {
			console.log("The current URL is '/users'");
		},
		matchContent: `
			<h2>This is where the users are.</h2>
			<div id="users-outlet"></div>
		`,
		matchOutlet: "#users-outlet",
		children: [{
			path: ":id",
			onActivate: ({ id }) => {
				console.log(`The current URL is /users/${id}`)
			},
			matchContent: `
				<h3>This is where the specific user is.</h3>
			`
		}]
	}]
}])
```

## Behavior

* Routes are evaluated in order. This means the first occurring parent of a matching route tree will be the one activated, even if there are multiple matching routes in the config.
* The entire route path must be matched for the path to activate. That is, a route with path `/` and no children will not activate at URL `/test`.
* Once an entire path is matched by a route and its children, each route's `onActivate` method is called, starting from the parent and continuing to the children.

## API

TODO 
