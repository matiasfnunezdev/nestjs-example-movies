export type UserRoleType = 'user' | 'admin'

export class UserDocument {
  static collectionName = 'users';

  userId?: string
  role?: UserRoleType
  created?: string;
  deleted?: boolean;
}
