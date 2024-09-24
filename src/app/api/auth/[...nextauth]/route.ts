import { handlers } from '@/auth';
import { notFound } from 'next/navigation';

const AUTH_SECRET = process.env.AUTH_SECRET;
const CREDENTIAL_USERNAME = process.env.CREDENTIAL_USERNAME;
const CREDENTIAL_PASSWORD = process.env.CREDENTIAL_PASSWORD;
const isRequiredAuthentication = Boolean(AUTH_SECRET && CREDENTIAL_USERNAME && CREDENTIAL_PASSWORD);

export const GET = isRequiredAuthentication
  ? handlers.GET
  : async () => {
      notFound();
    };
export const POST = isRequiredAuthentication
  ? handlers.POST
  : async () => {
      notFound();
    };
