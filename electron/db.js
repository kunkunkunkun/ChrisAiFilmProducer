import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'ai_producer.sqlite');

let db;

export function initDb() {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT,
            template TEXT,
            status TEXT,
            shootDate TEXT,
            isTentative INTEGER DEFAULT 0,
            duration TEXT,
            income REAL DEFAULT 0,
            uncleared REAL DEFAULT 0,
            people_json TEXT DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            urgency INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
    `);

    // Seed initial data if projects is empty
    const stmt = db.prepare('SELECT COUNT(*) as count FROM projects');
    if (stmt.get().count === 0) {
        const insertProject = db.prepare(`
            INSERT INTO projects (name, code, template, status, shootDate, isTentative, duration, income, uncleared, people_json) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const info = insertProject.run('Neon Shadows', 'NS-2026', 'Standard Film Production', 'In progress', '2026-05-15', 0, '45 Days', 50000, 25000, JSON.stringify([{ name: 'Sarah Chen', role: 'Executive Producer', email: 'sarah.chen@stellarvisions.com' }]));
        
        insertProject.run('The Silent Echo', 'SE-2026', 'Commercial Spot', 'Confirmed', '2026-08-10', 1, '12 Days', 15000, 5000, JSON.stringify([{ name: 'Marcus Thorne', role: 'DOP', email: 'm.thorne@luminastudios.com' }]));
        
        // Add sample tasks
        const insertTask = db.prepare('INSERT INTO tasks (project_id, description, status, urgency) VALUES (?, ?, ?, ?)');
        insertTask.run(info.lastInsertRowid, 'Initial setup', 'pending', 0);
        insertTask.run(info.lastInsertRowid, 'Hire cameraman', 'pending', 1);
    }
}

// Project Operations
export function getProjects() {
    return db.prepare('SELECT * FROM projects').all();
}

export function getProject(id) {
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function addProject(project) {
    const stmt = db.prepare(`
        INSERT INTO projects (name, code, template, status, shootDate, isTentative, duration, income, uncleared, people_json)
        VALUES (@name, @code, @template, @status, @shootDate, @isTentative, @duration, @income, @uncleared, @people_json)
    `);
    const info = stmt.run({
        name: project.name || '',
        code: project.code || '',
        template: project.template || '',
        status: project.status || 'Draft',
        shootDate: project.shootDate || '',
        isTentative: project.isTentative ? 1 : 0,
        duration: project.duration || '',
        income: project.income || 0,
        uncleared: project.uncleared || 0,
        people_json: JSON.stringify(project.people || [])
    });
    return getProject(info.lastInsertRowid);
}

export function updateProject(id, updates) {
    const sets = [];
    const values = {};
    for (const [key, val] of Object.entries(updates)) {
        if (key === 'id') continue;
        sets.push(`${key} = @${key}`);
        values[key] = key === 'people' ? JSON.stringify(val) : (key === 'isTentative' ? (val ? 1 : 0) : val);
    }
    
    if (values.people !== undefined) {
        values.people_json = values.people;
        delete values.people;
        const idx = sets.indexOf('people = @people');
        if (idx > -1) sets[idx] = 'people_json = @people_json';
    }

    if (sets.length === 0) return false;

    values.id = id;
    const sql = `UPDATE projects SET ${sets.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(values);
    return true;
}

export function deleteProject(id) {
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return true;
}

// Task Operations
export function getTasks(projectId = null) {
    if (projectId) {
        return db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(projectId);
    }
    return db.prepare('SELECT * FROM tasks').all();
}

export function addTask(task) {
    const stmt = db.prepare('INSERT INTO tasks (project_id, description, status, urgency) VALUES (@project_id, @description, @status, @urgency)');
    const info = stmt.run({
        project_id: task.projectId || task.project_id || null, 
        description: task.description || '',
        status: task.status || 'pending',
        urgency: task.urgency || 0
    });
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
}

export function updateTask(id, updates) {
    const sets = [];
    const values = {};
    for (const [key, val] of Object.entries(updates)) {
        if (key === 'id' || key === 'project_id' || key === 'created_at') continue;
        sets.push(`${key} = @${key}`);
        values[key] = val;
    }
    if (sets.length === 0) return false;
    values.id = id;
    const sql = `UPDATE tasks SET ${sets.join(', ')} WHERE id = @id`;
    db.prepare(sql).run(values);
    return true;
}

export function deleteTask(id) {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return true;
}

export function getStats() {
    const allTasks = db.prepare('SELECT count(*) as count FROM tasks').get().count;
    const doneTasks = db.prepare("SELECT count(*) as count FROM tasks WHERE status = 'done' OR status = 'completed'").get().count;
    const pendingTasks = allTasks - doneTasks;
    const urgentTasks = db.prepare('SELECT count(*) as count FROM tasks WHERE urgency > 0 AND status != \'done\'').get().count;
    
    return {
        completion: allTasks > 0 ? Math.round((doneTasks / allTasks) * 100) : 0,
        pending: pendingTasks,
        urgent: urgentTasks,
        cost: 42 
    };
}

export function getLegacyProjects() {
    const projects = getProjects();
    const tasks = getTasks();
    
    return projects.map(p => {
        const pTasks = tasks.filter(t => t.project_id === p.id);
        const taskStrings = pTasks.map(t => t.description).join('; ');
        
        let parsedPeople = [];
        try { if (p.people_json) parsedPeople = JSON.parse(p.people_json); } catch(e){}
        
        return {
            ...p,
            isTentative: p.isTentative === 1,
            people: parsedPeople,
            tasks: taskStrings, 
            taskDetails: pTasks 
        };
    });
}
