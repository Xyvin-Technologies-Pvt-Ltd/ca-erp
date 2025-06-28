import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getEvents, deleteEvent } from '../../api/events.api';
import EventModal from '../../components/EventModal';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await getEvents();
            setEvents(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            toast.error('Failed to fetch events');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleEdit = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const handleDelete = (event) => {
        setSelectedEvent(event);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!selectedEvent) return;
        try {
            await deleteEvent(selectedEvent._id);
            toast.success('Event deleted successfully');
            fetchEvents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete event');
        } finally {
            setShowDeleteConfirm(false);
            setSelectedEvent(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Event
                </button>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No events found. Add your first event!
                                </td>
                            </tr>
                        ) : (
                            events.map((event) => (
                                <tr key={event._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {event.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {event.description}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {event.startDate ? new Date(event.startDate).toLocaleDateString() : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {event.endDate ? new Date(event.endDate).toLocaleDateString() : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                            event.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {event.status ? event.status.toUpperCase() : ''}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => handleEdit(event)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <EventModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedEvent(null);
                }}
                onSuccess={() => {
                    setShowModal(false);
                    setSelectedEvent(null);
                    fetchEvents();
                }}
                event={selectedEvent}
            />
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Event</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Are you sure you want to delete this event? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events; 