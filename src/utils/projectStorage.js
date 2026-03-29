/**
 * projectStorage.js
 * Utility for CRUD operations on projects and tasks using the local SQLite DB via IPC.
 */

// We use window.require since contextIsolation is false in main.js
const { ipcRenderer } = window.require('electron');

export const projectStorage = {
    /**
     * Load all projects from DB
     */
    async loadProjects() {
        try {
            return await ipcRenderer.invoke('db-get-projects');
        } catch (err) {
            console.error("Failed to load projects:", err);
            return [];
        }
    },

    /**
     * Add a single project
     */
    async addProject(newProject) {
        try {
            return await ipcRenderer.invoke('db-add-project', newProject);
        } catch (err) {
            console.error("Failed to add project:", err);
            return null;
        }
    },

    /**
     * Update a project
     */
    async updateProject(id, updatedData) {
        try {
            return await ipcRenderer.invoke('db-update-project', id, updatedData);
        } catch (err) {
            console.error("Failed to update project:", err);
            return false;
        }
    },

    /**
     * Delete a project
     */
    async deleteProject(id) {
        try {
            return await ipcRenderer.invoke('db-delete-project', id);
        } catch (err) {
            console.error("Failed to delete project:", err);
            return false;
        }
    }
};

export const taskStorage = {
    async getTasks(projectId = null) {
        try {
            return await ipcRenderer.invoke('db-get-tasks', projectId);
        } catch (err) {
            console.error("Failed to load tasks:", err);
            return [];
        }
    },
    
    async addTask(task) {
        try {
            return await ipcRenderer.invoke('db-add-task', task);
        } catch (err) {
            console.error("Failed to add task:", err);
            return null;
        }
    },
    
    async updateTask(id, updates) {
        try {
            return await ipcRenderer.invoke('db-update-task', id, updates);
        } catch (err) {
            console.error("Failed to update task:", err);
            return false;
        }
    },
    
    async deleteTask(id) {
        try {
            return await ipcRenderer.invoke('db-delete-task', id);
        } catch (err) {
            console.error("Failed to delete task:", err);
            return false;
        }
    },
    
    async getStats() {
        try {
            return await ipcRenderer.invoke('db-get-stats');
        } catch (err) {
            console.error("Failed to load stats:", err);
            return { completion: 0, pending: 0, urgent: 0, cost: 0 };
        }
    }
};
