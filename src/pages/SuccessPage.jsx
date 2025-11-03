import { Link } from 'react-router-dom';
import Header from '../components/Header';

function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your appointment has been successfully booked. You'll receive a confirmation email shortly.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Important:</strong> Please arrive 5 minutes early for your appointment.
            </p>
            <p className="text-sm text-blue-800">
              Payment will be collected in person after your service.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <p className="text-sm text-yellow-800">
              <strong>Need to cancel or reschedule?</strong> Please contact us via Instagram <a href="https://www.instagram.com/chin_blends/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">@chin_blends</a>
            </p>
          </div>

          <div className="space-y-4">
            <Link
              to="/"
              className="block w-full py-3 px-6 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Book Another Appointment
            </Link>
            <a
              href="https://www.instagram.com/chin_blends/"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Follow on Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuccessPage;
