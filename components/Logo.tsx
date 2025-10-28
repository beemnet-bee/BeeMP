import React from 'react';

interface LogoProps {
    width?: number | string;
    height?: number | string;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ width = 100, height = 100, className }) => {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path d="M12 2L4 6.9282V17.0718L12 22L20 17.0718V6.9282L12 2Z" fill="#FBBF24" />
            <path d="M12 2L4 6.9282V17.0718L12 22L20 17.0718V6.9282L12 2Z" stroke="white" strokeWidth="1.5" />
            <path d="M14.5 10.0385C15.1188 10.4226 15.5 11.1391 15.5 11.9091C15.5 13.3421 14.3421 14.5 12.9091 14.5C12.3932 14.5 11.9103 14.3323 11.5 14.0385M14.5 10.0385V6.5C14.5 6.22386 14.2761 6 14 6H11C10.7239 6 10.5 6.22386 10.5 6.5V12.75C10.5 13.1642 10.1642 13.5 9.75 13.5C9.33579 13.5 9 13.1642 9 12.75C9 12.3358 9.33579 12 9.75 12H10.5M14.5 10.0385C14.0897 10.2315 13.6264 10.3661 13.1364 10.3995" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export default Logo;
