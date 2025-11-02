const services = [
  {
    id: 1,
    name: 'Fade & Beard',
    duration: '1 hr',
    description: 'Complete fade haircut with beard trim and shaping'
  },
  {
    id: 2,
    name: 'Fade',
    duration: '45 mins',
    description: 'Classic or modern fade tailored to your style'
  },
  {
    id: 3,
    name: 'Shape Up',
    duration: '30 mins',
    description: 'Lineup and edge up for a fresh look'
  },
  {
    id: 4,
    name: 'Shapeup With Beard',
    duration: '30 mins',
    description: 'Lineup with precision beard trimming'
  },
  {
    id: 5,
    name: 'Beard Only',
    duration: '30 mins',
    description: 'Precision beard trimming and shaping'
  }
];

function ServiceSelection({ onSelect }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Choose a Service</h2>
      <p className="text-gray-600 mb-8 text-center">Select the service you'd like to book</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="bg-white border-2 border-gray-200 rounded-lg p-6 text-left hover:border-black transition-all duration-200 hover:shadow-lg group"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-black">
                {service.name}
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {service.duration}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{service.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 text-center">
          💰 Payment is made in person after your appointment
        </p>
      </div>
    </div>
  );
}

export default ServiceSelection;
