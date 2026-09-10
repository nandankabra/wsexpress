# AWS Deployment Guide

This deployment uses ECS Fargate for the containers and managed AWS services for persistence.

## Recommended architecture

- Amazon ECR: one image repository per service and the frontend.
- ECS Fargate: one service per container in private subnets.
- Application Load Balancer: public entry point for the API gateway and frontend.
- Amazon RDS PostgreSQL: auth, user, carrier, and shipment databases.
- Amazon RDS MySQL: pricing and location databases.
- MongoDB Atlas or Amazon DocumentDB: tracking, CRM, and audit databases.
- Amazon SES: verification, password reset, and shipment email.
- AWS Secrets Manager: JWT, database, admin, and SMTP secrets.
- CloudWatch Logs: centralized container logs and alarms.

## Public routing

Use separate ALB hostnames or path rules:

- `app.example.com` -> frontend ECS service
- `api.example.com` -> API gateway ECS service

Set the frontend ECS environment variable:

```text
API_GATEWAY_URL=https://api.example.com
```

Set the gateway environment variable:

```text
CORS_ORIGIN=https://app.example.com
```

Never use `localhost`, `*`, or Docker service names for these production values.

## Required production environment

Every Node service must receive the same strong values for:

```text
NODE_ENV=production
JWT_SECRET=<random value at least 32 characters>
JWT_REFRESH_SECRET=<different random value at least 32 characters>
```

Auth service additionally requires:

```text
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong unique password>
DATABASE_URL=<RDS PostgreSQL auth database URL>
```

Notification service additionally requires SES SMTP settings:

```text
SMTP_HOST=email-smtp.<region>.amazonaws.com
SMTP_PORT=587
SMTP_USER=<SES SMTP username>
SMTP_PASSWORD=<SES SMTP password>
SMTP_FROM=ShipTrack <no-reply@example.com>
```

Configure all database URLs and service URLs as ECS secrets or environment variables. Do not put
passwords in task definitions committed to source control.

## Deployment order

1. Create VPC, private subnets, security groups, ECS cluster, ECR repositories, and CloudWatch log groups.
2. Create RDS PostgreSQL and MySQL instances and apply the service migrations.
3. Create MongoDB Atlas or DocumentDB databases for tracking, CRM, and audit.
4. Verify the SES sender domain and request production sending access.
5. Build and push each Docker image to ECR.
6. Deploy databases and foundational services first.
7. Deploy the API gateway and register its ALB target group.
8. Deploy the frontend with `API_GATEWAY_URL=https://api.example.com`.
9. Test login, registration, verification email, password reset, carrier creation, shipment creation,
   public tracking, GraphQL, and admin analytics.
10. Enable HTTPS certificates, CloudWatch alarms, backups, and rollback policies before launch.

## Minimum security rules

- Keep databases private; allow access only from the ECS security group.
- Expose only ports 80/443 through the ALB.
- Store secrets in Secrets Manager and rotate them regularly.
- Enable RDS automated backups and deletion protection for production databases.
- Enable ALB access logs and CloudWatch alarms for 5xx responses, unhealthy targets, and latency.
- Use least-privilege IAM roles for ECS tasks and deployment pipelines.
