import NextAuth, { User, CredentialsSignin, AuthError } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const AUTH_SECRET = process.env.AUTH_SECRET;
const CREDENTIAL_USERNAME = process.env.CREDENTIAL_USERNAME;
const CREDENTIAL_PASSWORD = process.env.CREDENTIAL_PASSWORD;
const isRequiredAuthentication = AUTH_SECRET && CREDENTIAL_USERNAME && CREDENTIAL_PASSWORD;

declare module 'next-auth' {
  interface User {
    username: string;
    password: string;
    expires: string;
    accessToken: string;
  }
  interface Session {
    accessToken: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken: string;
  }
}

export class InvalidCredentials extends AuthError {
  public readonly message: string;

  constructor(msg: string) {
    super();
    this.message = msg;
    this.stack = undefined;
  }
}

export const {
  handlers,
  signIn,
  signOut,
  auth,
  unstable_update: update
} = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt', // JSON Web Token 사용
    maxAge: 60 * 60 * 24 // 세션 만료 시간(sec)
  },
  pages: {
    signIn: '/signin' // Default: '/auth/signin'
  },
  callbacks: {
    signIn: async (user) => {
      if (!user.credentials) {
        return false;
      }

      return true;
    },
    jwt: async ({ token, user }) => {
      if (user?.accessToken) {
        token.accessToken = user.accessToken;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token?.accessToken) {
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  providers: !isRequiredAuthentication
    ? []
    : [
        Credentials({
          credentials: {
            username: { label: 'Username' },
            password: { label: 'Password', type: 'password' }
          },
          async authorize(credentials, request) {
            const { username, password } = credentials as Partial<
              Record<'username' | 'password', string>
            >;

            if (
              typeof username !== 'string' ||
              typeof password !== 'string' ||
              CREDENTIAL_USERNAME !== username ||
              CREDENTIAL_PASSWORD !== password
            ) {
              if (username) console.debug(`Attempted Signin, username: \`${username}\``);
              throw new InvalidCredentials('Invalid credentials');
            }

            let user = { username, password, accessToken: '', expires: '' } satisfies User;

            return user;
          }
        })
      ]
});
