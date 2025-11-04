const services = [
  {
    id: 1,
    name: 'Haircut',
    price: '$30',
    duration: '45 mins',
    description: 'Classic or modern cut tailored to your style'
  },
  {
    id: 2,
    name: 'Beard Trim',
    price: '$10',
    duration: '20 mins',
    description: 'Precision trimming and shaping'
  },
  {
    id: 3,
    name: 'Design',
    price: '$5',
    duration: '15 mins',
    description: 'Custom design and styling'
  }
];

function ServiceSelection({ onSelect }) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Choose a Service</h2>
      <p className="text-gray-600 mb-8 text-center">Select the service you'd like to book</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center hover:border-black transition-all duration-200 hover:shadow-lg group"
          >
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-black mb-3">
              {service.name}
            </h3>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              {service.price}
            </div>
            <p className="text-gray-600 text-sm mb-3">{service.description}</p>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
              {service.duration}
            </span>
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
