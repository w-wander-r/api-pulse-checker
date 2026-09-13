# API Pulse Check

API Pulse Check is an HTTP client application that allows users to build and send HTTP requests, inspect responses, and track request history. It provides a clean, browser-based interface for testing and debugging APIs.

## Overview

- **Purpose**: API Pulse Check simplifies API testing by providing an intuitive interface for constructing HTTP requests and analyzing responses — including status codes, response time, headers, and body content.

- **Web-Based**: As a web application, API Pulse Check runs entirely in the browser, requiring no installation or configuration. Simply open it in your browser and start testing.

- **Open Source**: The source code is available on GitHub, encouraging collaboration and contributions from developers around the world.

- **Client-Side**: All requests are made directly from the browser using the native Fetch API, making it lightweight and fast.

## Features

- **Request Builder**: Select HTTP method (GET, POST, PUT, DELETE, PATCH), enter URL, add custom headers, and include request body.

- **Response Viewer**: View status codes (color-coded by category), response time, response size, and formatted response body.

- **Request History**: Automatically logs all sent requests with method, URL, timestamp, and status for easy reference.

- **Error Handling**: Gracefully handles network errors, CORS issues, and timeouts with descriptive messages.

- **JSON Formatting**: Automatically pretty-prints JSON responses for readability.

## Technologies Used

- **Next.js**: React framework with App Router for file-based routing and build optimization.

- **React**: UI library for building component-based interactive interfaces.

- **TypeScript**: Static type safety for requests, responses, and application state.

- **Tailwind CSS**: Utility-first CSS framework for responsive, dark-mode-first styling.

- **Node.js**: Runtime for development server and build tooling.
