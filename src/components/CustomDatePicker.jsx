import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/airbnb.css';
import { Calendar } from 'lucide-react';
import './CustomDatePicker.css';

export default function CustomDatePicker({
    selected,
    onChange,
    label,
    required = false,
    disabled = false,
    minDate,
    maxDate
}) {
    const handleChange = (dates) => {
        if (dates && dates[0]) {
            const date = dates[0];
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
        }
    };

    // Convert string date to Date object for Flatpickr
    const dateValue = selected ? new Date(selected + 'T00:00:00') : null;

    return (
        <div className="custom-datepicker-wrapper">
            {label && (
                <label className="input-label">
                    {label} {required && '*'}
                </label>
            )}
            <div className="custom-datepicker-container">
                <Flatpickr
                    value={dateValue}
                    onChange={handleChange}
                    options={{
                        dateFormat: 'F j, Y',
                        minDate: minDate,
                        maxDate: maxDate,
                        disableMobile: true,
                        animate: true,
                        monthSelectorType: 'dropdown',
                        prevArrow: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
                        nextArrow: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
                    }}
                    className="custom-datepicker-input"
                    disabled={disabled}
                    placeholder="Select date..."
                />
                <Calendar size={18} className="datepicker-icon" />
            </div>
        </div>
    );
}
