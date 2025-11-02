import { useState } from 'react';
import ServiceSelection from '../components/ServiceSelection';
import TimeSlotPicker from '../components/TimeSlotPicker';
import BookingForm from '../components/BookingForm';
import Header from '../components/Header';

function BookingPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleTimeSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedService(null);
    } else if (step === 3) {
      setStep(2);
      setSelectedTimeSlot(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-black' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-black text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 hidden sm:inline">Service</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-black' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-black text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 hidden sm:inline">Time</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-black' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 3 ? 'bg-black text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2 hidden sm:inline">Details</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <ServiceSelection onSelect={handleServiceSelect} />
          )}

          {step === 2 && (
            <TimeSlotPicker
              service={selectedService}
              onSelect={handleTimeSelect}
              onBack={handleBack}
            />
          )}

          {step === 3 && (
            <BookingForm
              service={selectedService}
              timeSlot={selectedTimeSlot}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
