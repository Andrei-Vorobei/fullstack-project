## Project setup

```bash
$ npm install
```

## Authentication tokens

Set `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `FRONTEND_ORIGINS` in the
environment. Use different, high-entropy values for the token secrets.
`FRONTEND_ORIGINS` is a comma-separated list of allowed browser origins; it
defaults to `http://localhost:5173`. The access token is returned as
`access_token` in the JSON response and expires after one hour. The refresh
token is sent as an HttpOnly `refresh_token` cookie and expires after seven
days. In production, use HTTPS and set `NODE_ENV=production` so the cookie is
sent with `Secure` and `SameSite=None`.

Registration (`POST /auth/signup`) and sign-in (`POST /auth/signin`) issue both
tokens. Use `POST /auth/refresh` with cookies enabled to obtain a new access
token. `POST /auth/logout` clears the refresh cookie.

New users receive `roles: ["user"]` by default. The supported roles are `user`
and `admin`; role assignment is intentionally excluded from public registration
and profile-update requests.

For browser requests, include credentials so the browser can receive and send
the HttpOnly cookie:

```js
const response = await fetch('http://localhost:3000/auth/signin', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { access_token } = await response.json();
```

Keep the access token in application memory and send it as a Bearer token for
protected API requests. Refresh tokens are not returned in JSON and cannot be
read directly by browser JavaScript.

Refresh tokens are stateless JWTs: refreshing issues a new access token but
does not rotate or revoke the refresh token. Logout clears the browser cookie;
a previously copied refresh token remains valid until it expires.

When the access token expires, request a replacement using the refresh cookie:

```js
const response = await fetch('http://localhost:3000/auth/refresh', {
  method: 'POST',
  credentials: 'include',
});

const { access_token } = await response.json();
```

## Shopping cart

Cart routes require an access token in the `Authorization: Bearer <token>`
header. The cart is selected from the authenticated user; clients must not send
a user ID.

- `GET /cart` returns the current cart, item count, and total price.
- `POST /cart/items` adds a product or increases its existing quantity:

```json
{
  "productId": "product-uuid",
  "quantity": 2
}
```

- `PATCH /cart/items/:itemId` sets a cart item's quantity with
  `{ "quantity": 3 }`.
- `DELETE /cart/items/:itemId` removes one item.
- `DELETE /cart/items` clears the cart.

Quantities must be positive integers and cannot exceed available stock.
Minimum order quantities are checked at checkout, not while editing the cart.
The cart is created when a user first changes it; reading a user without a
cart returns an empty response.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

To add it to this project:

```bash
$ npm install @nestjs/observe
```

Then follow the [setup guide](https://docs.nestjs.com/observability/overview) - it takes a single import and an app key.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
