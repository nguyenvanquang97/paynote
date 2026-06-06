export interface RequestUser {
  id: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
