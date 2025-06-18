export function BarangayFooter() {
  return (
    <footer className="w-full text-center text-xs text-gray-500 bg-white/80 backdrop-blur-sm py-2 lg:py-3 px-4 lg:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main footer content in horizontal layout */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0 text-xs lg:text-sm">
          {/* Office Hours */}
          <div className="text-left">
            <span className="font-medium">Office Hours:</span> Mon-Fri 8:00 AM -
            5:00 PM | Sat 8:00 AM - 12:00 PM
          </div>

          {/* Support Contact */}
          <div className="text-center">
            <span className="font-medium">Support:</span> (02) 1234-5678 |
            support.vantage@dilg.gov.ph
          </div>

          {/* Copyright */}
          <div className="text-right text-gray-400">
            &copy; 2024 DILG-Sulop | The VANTAGE Project
          </div>
        </div>
      </div>
    </footer>
  );
}
