import { Request, Response, NextFunction } from 'express';

export interface IHandlerModule {
  name?: string;
  index?: (req: Request, res: Response, next?: NextFunction) => any;
  handler?: (req: Request, res: Response) => any;
  default?: any;
}

declare module '*.json' {
  const value: any;
  export default value;
}
