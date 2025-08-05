 {edit ? (
                        <form
                          onSubmit={handleEditedSectionUpdate}
                          className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                        >
                          <input
                            type="text"
                            name="name"
                            value={editedSection.name}
                            onChange={handleEditedSectionChange}
                            placeholder="Name"
                            className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-lg"
                          />

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEdit(false)}
                              className="text-gray-600 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            {sections.map((section) => (
                              <>
                                <div key={section._id}>
                                  <h3 className="text-2xl font-semibold">
                                    {section.name}
                                  </h3>
                                </div>
                                <div className="flex gap-4">
                                  <button className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                                    Add Project
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSectionEdit(true, section)
                                    }
                                    className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleSectionDelete(section._id)
                                    }
                                    className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            ))}
                          </div>
                        </>
                      )}