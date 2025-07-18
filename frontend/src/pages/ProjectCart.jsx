import React, { useEffect, useState } from 'react';
import { projectsApi } from '../api/projectsApi'; // Make sure the path is correct

const ProjectCart = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getAllProjects();
      if (!data?.data || !Array.isArray(data.data)) {
        throw new Error('Invalid API response format');
      }
      setProjects(data.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("Failed to load projects. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-700">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <table className="min-w-full table-auto border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <thead className="bg-white">
          <tr>
            <th className="p-3 text-left font-medium text-gray-900 border border-gray-300">Project Name</th>
            <th className="p-3 text-left font-medium text-gray-900 border border-gray-300">Client Name</th>
            <th className="p-3 text-left font-medium text-gray-900 border border-gray-300">Budget</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project._id} className="bg-white even:bg-gray-50">
              <td className="p-3 text-gray-800 border border-gray-300">{project.name}</td>
              <td className="p-3 text-gray-800 border border-gray-300">{project.client?.name || 'N/A'}</td>
              <td className="p-3 text-gray-800 border border-gray-300">{project.budget ? `$${project.budget}` : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectCart;
