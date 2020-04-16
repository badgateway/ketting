declare const validEmail: unique symbol;

type Email = string & {
  [validEmail]: true
}

export type User = {
  firstName: string;
  lastName: string;
  email: Email
}

function save(user:User) {

}

function assertValidEmail(input: string): asserts input is Email {
  
  if (!input.includes('@')) {
    throw new Error(`The string: ${input} is not a valid email address`);
  }

}

const email = 'foo@example.org';
 assertValidEmail(email);
const user:User = {
  firstName: 'Evert',
  lastName: 'Pot',
  email,
}

save(user);
