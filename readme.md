# Express RESTful API.

Powered by Node.js, Express.js & MongoDB with API authentication using JWT (JSON Web Token)

## Routes

| ROUTE                  |  HTTP  | DESCRIPTION                                         |
| ---------------------- | :----: | --------------------------------------------------- |
| /                      |  GET   | Main index page                                     |
| /v1                    |  GET   | API_V1 index apge                                   |
| /v1/auth/login         |  POST  | Login an existing user with user credentials        |
| /v1/auth/signup        |  POST  | Register a new user with input credentials          |
| /v1/auth/logout        |  POST  | Delete all access and refresh token                 |
| /v1/auth/accessToken   |  POST  | Generate access token with refresh token            |
| /v1/users              |  GET   | Show all users                                      |
| /v1/users/:id          |  GET   | Show by user id                                     |
| /v1/users              |  POST  | Create a new user                                   |
| /v1/users/:id          |  PUT   | Update user by user id                              | 
| /v1/users/:id          | DELETE | Delete user by user id                              |
| /v1/customers          |  GET   | Show all customers                                  |
| /v1/customers/:id      |  GET   | Show by customer id                                 |
| /v1/customers          |  POST  | Create a new customer                               |
| /v1/customers/:id      |  PUT   | Update customer by customer id                      | 
| /v1/customers/:id      | DELETE | Delete customer by customer id                      |

## Requirements

- You must have [Node.js](https://nodejs.org/) and [MongoDB](https://mongodb.com/) installed

## Installation & Running Server:

1. Install npm dependencies

```
npm install
```

2. To start the server

```
npm start
```
