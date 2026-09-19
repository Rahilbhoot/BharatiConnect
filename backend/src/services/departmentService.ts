import { Department } from '../models/Department';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { ConflictError, NotFoundError } from '../utils/AppError';

export class DepartmentService {
  static async createDepartment(name: { en: string, mr: string }, adminId: string) {
    const existing = await Department.findOne({ $or: [{ 'name.en': name.en }, { 'name.mr': name.mr }] });
    if (existing) throw new ConflictError('Department name already exists');

    const dept = await Department.create({ name });

    await AuditLog.create({
      actorId: adminId,
      action: 'CREATE_DEPARTMENT',
      targetType: 'Department',
      targetId: dept.id,
      after: name
    });

    return dept;
  }

  static async listDepartments() {
    return await Department.find({ active: true });
  }

  static async updateDepartment(id: string, name: { en: string, mr: string }, adminId: string) {
    const dept = await Department.findById(id);
    if (!dept) throw new NotFoundError('Department not found');

    const before = dept.name;
    dept.name = name;
    await dept.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'UPDATE_DEPARTMENT',
      targetType: 'Department',
      targetId: dept.id,
      before,
      after: name
    });

    return dept;
  }

  static async deleteDepartment(id: string, adminId: string) {
    const dept = await Department.findById(id);
    if (!dept) throw new NotFoundError('Department not found');

    const staffCount = await User.countDocuments({ departmentId: id, active: true });
    if (staffCount > 0) throw new ConflictError('Cannot delete department with active staff');

    dept.active = false;
    await dept.save();

    await AuditLog.create({
      actorId: adminId,
      action: 'DELETE_DEPARTMENT',
      targetType: 'Department',
      targetId: dept.id
    });

    return { success: true };
  }
}
