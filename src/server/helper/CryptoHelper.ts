import crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const algorithm = 'aes-256-ctr';
const saltRounds = 5;

export const encrypt = ({
  content,
  secretKey: _secretKey
}: {
  secretKey: string;
  content: string;
}) => {
  const initVector = crypto.randomBytes(16);
  const secretKey = _secretKey.padEnd(32, '*');

  const cipher = crypto.createCipheriv(algorithm, secretKey, initVector);

  const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);

  return {
    initVector: initVector.toString('hex'),
    content: encrypted.toString('hex')
  };
};

export const decrypt = ({
  initVector,
  secretKey: _secretKey,
  content
}: {
  secretKey: string;
  initVector: string;
  content: string;
}) => {
  const secretKey = _secretKey.padEnd(32, '*');
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(initVector, 'hex'));

  const decrpyted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);

  return decrpyted.toString();
};

export const encryptSecretkey = (secretKey: string) => {
  return bcrypt.hashSync(secretKey, saltRounds);
};

export const compareSecretkey = (secretKey: string, hashedSecretKey: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(secretKey, hashedSecretKey, (err: Error | undefined, same: boolean) => {
      if (err) reject(false);
      if (!same) reject(false);
      resolve(true);
    });
  });
};
