# NYC Transit Dashboard

A realtime transit dashboard for NYC Subway, Bus, and Metro-North, built with Next.js.

## Features

- **Realtime Arrivals**: Live data for configured stops.
- **Unified Interface**: View Subway, Bus, and Commuter Rail in one place.
- **GTFS Integration**: Maps realtime feeds to static schedule data for accurate destination signs.
- **Dark Mode**: Automatic system theme detection with manual toggle.

## Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/transit-dashboard.git
    cd transit-dashboard
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Configure Environment**
    Create a `.env.local` file with your MTA API keys (MTA API Portal, MTA Bus Time):
    ```env
    MTA_API_KEY=your_mta_api_key
    MTA_BUS_TIME_KEY=your_bus_time_key
    ```

4.  **Run the development server**
    ```bash
    pnpm dev
    ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.