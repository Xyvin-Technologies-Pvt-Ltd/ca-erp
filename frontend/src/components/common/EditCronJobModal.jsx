import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { cronJobsApi } from "../../api/cronJobs";

const EditCronJobModal = ({ data, isOpen, onClose, msg, id }) => {
  // console.log(isOpen);
  const [modified, setModified] = useState({
    cronId: "",
    name: "",
    startDate: "",
    description: "",
    frequency: "",
    client: "",
  });
  useEffect(() => {
    const getCronJob = async (id) => {
      const res = await cronJobsApi.getCronJob(id);
      setModified((prev) => ({
        ...prev,
        cronId: res.data.id,
        name: res.data.name,
        startDate: res.data.startDate,
        description: res.data.description,
        frequency: res.data.frequency,
        client: res.data.client,
      }));
    };
    getCronJob(id);
  }, []);
  const updateCronJobData = async () => {
    try {
      const res = await cronJobsApi.updateCronJob(id, modified);
      if (res.success === true) {
        onClose();
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black-50 bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Name *
                    </label>
                    {/* <input
                type="text"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                placeholder="Enter project name"
              /> */}
                    <input
                      type="text"
                      name="name"
                      value={modified.name}
                      onChange={(e) => {
                        setModified({ ...modified, name: e.target.value });
                        // setShowDropdown(true);
                      }}
                      // onFocus={() => setShowDropdown(true)}
                      // onBlur={() => setTimeout(() => setShowDropdown(false), 100)} // delay to allow clicking dropdown item
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      placeholder="Enter project name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={
                        modified.startDate === ""
                          ? ""
                          : new Date(modified?.startDate)
                              .toISOString()
                              .split("T")[0]
                      }
                      // min={new Date().toISOString().split('T')[0]}
                      onChange={(e) =>
                        setModified({ ...modified, startDate: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Frequency
                    </label>
                    <div className="flex space-x-2">
                      {["weekly", "monthly", "yearly"].map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() =>
                            setModified({ ...modified, frequency: freq })
                          }
                          className={`px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm
                            ${
                              modified.frequency === freq
                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent scale-105 shadow-lg"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-300"
                            }`}
                          aria-pressed={modified.frequency === freq}
                        >
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={modified.description}
                      onChange={(e) =>
                        setModified({
                          ...modified,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      rows="3"
                      placeholder="Enter project description"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateCronJobData}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                  >
                    {/* <svg
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg> */}
                    Update
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditCronJobModal;
