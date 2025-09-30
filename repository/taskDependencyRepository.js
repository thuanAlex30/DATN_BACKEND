const TaskDependency = require('../models/taskDependency');
const ProjectTask = require('../models/projectTask');

class TaskDependencyRepository {
  // ========== DEPENDENCY CRUD ==========
  async getTaskDependencies(taskId) {
    return await TaskDependency.find({ 
      $or: [{ predecessor_task_id: taskId }, { successor_task_id: taskId }] 
    })
      .populate('predecessor_task_id', 'task_name task_code')
      .populate('successor_task_id', 'task_name task_code')
      .sort({ created_at: -1 });
  }

  async getDependencyById(id) {
    return await TaskDependency.findById(id)
      .populate('predecessor_task_id', 'task_name task_code')
      .populate('successor_task_id', 'task_name task_code');
  }

  async createDependency(dependencyData) {
    const dependency = new TaskDependency(dependencyData);
    return await dependency.save();
  }

  async updateDependency(id, updateData) {
    return await TaskDependency.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true }
    );
  }

  async deleteDependency(id) {
    return await TaskDependency.findByIdAndDelete(id);
  }

  // ========== DEPENDENCY VALIDATION ==========
  async checkCircularDependency(predecessorId, successorId) {
    // Check if adding this dependency would create a circular dependency
    const visited = new Set();
    const stack = [successorId];

    while (stack.length > 0) {
      const currentTaskId = stack.pop();
      
      if (visited.has(currentTaskId)) {
        continue;
      }
      
      visited.add(currentTaskId);
      
      if (currentTaskId.toString() === predecessorId.toString()) {
        return true; // Circular dependency detected
      }

      // Find all tasks that depend on current task
      const dependencies = await TaskDependency.find({ 
        predecessor_task_id: currentTaskId 
      }).select('successor_task_id');
      
      for (const dep of dependencies) {
        stack.push(dep.successor_task_id);
      }
    }

    return false;
  }

  async validateDependency(predecessorId, successorId) {
    // Check if tasks exist
    const predecessor = await ProjectTask.findById(predecessorId);
    const successor = await ProjectTask.findById(successorId);

    if (!predecessor || !successor) {
      return { valid: false, message: 'Một hoặc cả hai công việc không tồn tại' };
    }

    // Check if tasks are in the same project
    if (predecessor.project_id.toString() !== successor.project_id.toString()) {
      return { valid: false, message: 'Các công việc phải thuộc cùng một dự án' };
    }

    // Check if it's the same task
    if (predecessorId.toString() === successorId.toString()) {
      return { valid: false, message: 'Công việc không thể phụ thuộc vào chính nó' };
    }

    // Check for circular dependency
    const hasCircularDependency = await this.checkCircularDependency(predecessorId, successorId);
    if (hasCircularDependency) {
      return { valid: false, message: 'Tạo phụ thuộc vòng tròn không được phép' };
    }

    // Check if dependency already exists
    const existingDependency = await TaskDependency.findOne({
      predecessor_task_id: predecessorId,
      successor_task_id: successorId
    });

    if (existingDependency) {
      return { valid: false, message: 'Phụ thuộc đã tồn tại' };
    }

    return { valid: true };
  }

  // ========== DEPENDENCY ANALYSIS ==========
  async getCriticalPath(projectId) {
    const tasks = await ProjectTask.find({ project_id: projectId });
    const dependencies = await TaskDependency.find({
      $or: [
        { predecessor_task_id: { $in: tasks.map(t => t._id) } },
        { successor_task_id: { $in: tasks.map(t => t._id) } }
      ]
    });

    // Build dependency graph
    const graph = new Map();
    const inDegree = new Map();
    const taskMap = new Map();

    tasks.forEach(task => {
      graph.set(task._id.toString(), []);
      inDegree.set(task._id.toString(), 0);
      taskMap.set(task._id.toString(), task);
    });

    dependencies.forEach(dep => {
      const predId = dep.predecessor_task_id.toString();
      const succId = dep.successor_task_id.toString();
      
      graph.get(predId).push(succId);
      inDegree.set(succId, inDegree.get(succId) + 1);
    });

    // Topological sort with longest path calculation
    const queue = [];
    const distances = new Map();
    const parents = new Map();

    // Initialize distances and find starting tasks
    tasks.forEach(task => {
      const taskId = task._id.toString();
      distances.set(taskId, 0);
      
      if (inDegree.get(taskId) === 0) {
        queue.push(taskId);
      }
    });

    // Process tasks in topological order
    while (queue.length > 0) {
      const current = queue.shift();
      
      for (const neighbor of graph.get(current)) {
        const currentDistance = distances.get(current) || 0;
        const neighborDistance = distances.get(neighbor) || 0;
        const taskDuration = taskMap.get(current).estimated_duration || 0;
        
        if (currentDistance + taskDuration > neighborDistance) {
          distances.set(neighbor, currentDistance + taskDuration);
          parents.set(neighbor, current);
        }
        
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Find the task with maximum distance (end of critical path)
    let maxDistance = 0;
    let endTask = null;
    
    distances.forEach((distance, taskId) => {
      const taskDuration = taskMap.get(taskId).estimated_duration || 0;
      const totalDistance = distance + taskDuration;
      
      if (totalDistance > maxDistance) {
        maxDistance = totalDistance;
        endTask = taskId;
      }
    });

    // Reconstruct critical path
    const criticalPath = [];
    let current = endTask;
    
    while (current) {
      criticalPath.unshift({
        task_id: current,
        task_name: taskMap.get(current).task_name,
        estimated_duration: taskMap.get(current).estimated_duration,
        total_duration: distances.get(current) + (taskMap.get(current).estimated_duration || 0)
      });
      
      current = parents.get(current);
    }

    return {
      project_id: projectId,
      critical_path: criticalPath,
      total_duration: maxDistance,
      critical_tasks_count: criticalPath.length
    };
  }

  async getDependencyChain(taskId) {
    const visited = new Set();
    const chain = [];

    const buildChain = async (currentTaskId, direction) => {
      if (visited.has(currentTaskId)) return;
      
      visited.add(currentTaskId);
      
      const task = await ProjectTask.findById(currentTaskId)
        .populate('project_id', 'project_name');
      
      if (!task) return;

      chain.push({
        task_id: currentTaskId,
        task_name: task.task_name,
        project_name: task.project_id.project_name,
        direction: direction
      });

      if (direction === 'predecessor') {
        const dependencies = await TaskDependency.find({ 
          successor_task_id: currentTaskId 
        });
        
        for (const dep of dependencies) {
          await buildChain(dep.predecessor_task_id, 'predecessor');
        }
      } else {
        const dependencies = await TaskDependency.find({ 
          predecessor_task_id: currentTaskId 
        });
        
        for (const dep of dependencies) {
          await buildChain(dep.successor_task_id, 'successor');
        }
      }
    };

    await buildChain(taskId, 'predecessor');
    await buildChain(taskId, 'successor');

    return chain.sort((a, b) => {
      if (a.direction === 'predecessor' && b.direction === 'successor') return -1;
      if (a.direction === 'successor' && b.direction === 'predecessor') return 1;
      return 0;
    });
  }

  // ========== DEPENDENCY STATISTICS ==========
  async getDependencyStats(projectId) {
    const tasks = await ProjectTask.find({ project_id: projectId });
    const taskIds = tasks.map(task => task._id);

    const dependencies = await TaskDependency.find({
      $or: [
        { predecessor_task_id: { $in: taskIds } },
        { successor_task_id: { $in: taskIds } }
      ]
    });

    const totalDependencies = dependencies.length;
    const tasksWithDependencies = new Set();
    
    dependencies.forEach(dep => {
      tasksWithDependencies.add(dep.predecessor_task_id.toString());
      tasksWithDependencies.add(dep.successor_task_id.toString());
    });

    const dependencyTypes = dependencies.reduce((acc, dep) => {
      acc[dep.dependency_type] = (acc[dep.dependency_type] || 0) + 1;
      return acc;
    }, {});

    const inDegreeCount = new Map();
    const outDegreeCount = new Map();

    dependencies.forEach(dep => {
      const predId = dep.predecessor_task_id.toString();
      const succId = dep.successor_task_id.toString();
      
      outDegreeCount.set(predId, (outDegreeCount.get(predId) || 0) + 1);
      inDegreeCount.set(succId, (inDegreeCount.get(succId) || 0) + 1);
    });

    const maxInDegree = Math.max(...Array.from(inDegreeCount.values()), 0);
    const maxOutDegree = Math.max(...Array.from(outDegreeCount.values()), 0);

    return {
      project_id: projectId,
      total_tasks: tasks.length,
      total_dependencies: totalDependencies,
      tasks_with_dependencies: tasksWithDependencies.size,
      tasks_without_dependencies: tasks.length - tasksWithDependencies.size,
      dependency_types: dependencyTypes,
      max_in_degree: maxInDegree,
      max_out_degree: maxOutDegree,
      average_dependencies_per_task: tasks.length > 0 ? totalDependencies / tasks.length : 0
    };
  }

  // ========== DEPENDENCY QUERIES ==========
  async getDependenciesByType(dependencyType) {
    return await TaskDependency.find({ dependency_type: dependencyType })
      .populate('predecessor_task_id', 'task_name task_code')
      .populate('successor_task_id', 'task_name task_code')
      .sort({ created_at: -1 });
  }

  async getDependenciesByProject(projectId) {
    const tasks = await ProjectTask.find({ project_id: projectId });
    const taskIds = tasks.map(task => task._id);

    return await TaskDependency.find({
      $or: [
        { predecessor_task_id: { $in: taskIds } },
        { successor_task_id: { $in: taskIds } }
      ]
    })
      .populate('predecessor_task_id', 'task_name task_code')
      .populate('successor_task_id', 'task_name task_code')
      .sort({ created_at: -1 });
  }

  async getBlockedTasks(projectId) {
    const tasks = await ProjectTask.find({ 
      project_id: projectId,
      status: { $in: ['PENDING', 'IN_PROGRESS'] }
    });
    
    const taskIds = tasks.map(task => task._id);
    const dependencies = await TaskDependency.find({
      successor_task_id: { $in: taskIds }
    });

    const blockedTasks = [];
    
    for (const task of tasks) {
      const taskDependencies = dependencies.filter(dep => 
        dep.successor_task_id.toString() === task._id.toString()
      );
      
      if (taskDependencies.length > 0) {
        const predecessorIds = taskDependencies.map(dep => dep.predecessor_task_id);
        const predecessorTasks = await ProjectTask.find({
          _id: { $in: predecessorIds },
          status: { $ne: 'COMPLETED' }
        });
        
        if (predecessorTasks.length > 0) {
          blockedTasks.push({
            task_id: task._id,
            task_name: task.task_name,
            blocked_by: predecessorTasks.map(pred => ({
              task_id: pred._id,
              task_name: pred.task_name,
              status: pred.status
            }))
          });
        }
      }
    }

    return blockedTasks;
  }
}

module.exports = new TaskDependencyRepository();
