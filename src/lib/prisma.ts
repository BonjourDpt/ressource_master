export { db as prisma } from "./db";

/** Temporary: intentional type error to verify CI + Slack notify-failure. Remove immediately after test. */
const _ciSlackFailureTest: string = 1;
void _ciSlackFailureTest;
