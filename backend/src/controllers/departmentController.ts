import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/departmentService';

export class DepartmentController {
  static async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DepartmentService.createDepartment(req.body.name, req.user!.id);
      res.status(201).json(result);
    } catch (err) { next(err); }
  }

  static async listDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DepartmentService.listDepartments();
      res.json(result);
    } catch (err) { next(err); }
  }

  static async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DepartmentService.updateDepartment(req.params.id, req.body.name, req.user!.id);
      res.json(result);
    } catch (err) { next(err); }
  }

  static async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DepartmentService.deleteDepartment(req.params.id, req.user!.id);
      res.json(result);
    } catch (err) { next(err); }
  }
}
