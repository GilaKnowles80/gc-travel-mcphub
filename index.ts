// ============================================================
//  GC Travel & Tours — MCP Server
//  Framework: Node.js + Express + @modelcontextprotocol/sdk
//  Transport:  Streamable HTTP  (Base44 compatible)
//  Deploy to:  Railway / Render / Fly.io (free tier works)
//
//  Base44 "Add Custom MCP" URL:
//    https://your-deployed-url.railway.app/mcp
// ============================================================

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

// ── In-memory demo data (replace with real Base44 SDK calls) ─
// These simulate your Base44 entities so the server works
// immediately. Swap each function body for base44.entities.X calls.
const DEMO_TOURS = [
  { id: "t1", name: "Palawan Island Hopper", duration: "5D4N", price: 18500, slots: 12, destination: "Palawan", highlights: ["El Nido", "Coron", "Underground River"] },
  { id: "t2", name: "Boracay Beach Escape", duration: "4D3N", price: 12800, slots: 20, destination: "Boracay", highlights: ["White Beach", "Helmet Diving", "Island Hopping"] },
  { id: "t3", name: "Siargao Surf & Chill", duration: "5D4N", price: 15500, slots: 8, destination: "Siargao", highlights: ["Cloud 9 Surf", "Sugba Lagoon", "Magpupungko"] },
  { id: "t4", name: "Batanes Heritage Tour", duration: "6D5N", price: 22000, slots: 10, destination: "Batanes", highlights: ["Batan Island", "Sabtang", "Ivana Port"] },
];

const DEMO_BOOKINGS: any[] = [];

// ── MCP Server setup ─────────────────────────────────────────
const server = new McpServer({
  name:    "gc-travel-mcp",
  version: "1.0.0",
});

// ============================================================
//  TOOL 1: search_tours
//  Base44 AI can call this to find available tour packages
// ============================================================
server.tool(
  "search_tours",
  "Search GC Travel & Tours tour packages by destination, budget, or duration",
  {
    destination: z.string().optional().describe("Island or location (e.g. Palawan, Boracay, Siargao)"),
    max_price:   z.number().optional().describe("Maximum price in Philippine Pesos"),
    duration:    z.string().optional().describe("Trip duration e.g. '4D3N' or '5D4N'"),
  },
  async ({ destination, max_price, duration }) => {
    let results = [...DEMO_TOURS];

    if (destination) {
      results = results.filter(t =>
        t.destination.toLowerCase().includes(destination.toLowerCase()) ||
        t.name.toLowerCase().includes(destination.toLowerCase())
      );
    }
    if (max_price) {
      results = results.filter(t => t.price <= max_price);
    }
    if (duration) {
      results = results.filter(t => t.duration === duration);
    }

    if (results.length === 0) {
      return { content: [{ type: "text", text: "No tours found matching your criteria. Try adjusting your filters." }] };
    }

    const formatted = results.map(t =>
      `📍 **${t.name}**\n` +
      `   Duration: ${t.duration} | Price: ₱${t.price.toLocaleString()} per person\n` +
      `   Slots available: ${t.slots}\n` +
      `   Highlights: ${t.highlights.join(", ")}\n` +
      `   Tour ID: ${t.id}`
    ).join("\n\n");

    return { content: [{ type: "text", text: `Found ${results.length} tour(s):\n\n${formatted}` }] };
  }
);

// ============================================================
//  TOOL 2: get_tour_details
//  Get full info about a specific tour package
// ============================================================
server.tool(
  "get_tour_details",
  "Get complete details about a specific GC Travel tour package",
  {
    tour_id: z.string().describe("The tour ID (e.g. t1, t2)"),
  },
  async ({ tour_id }) => {
    const tour = DEMO_TOURS.find(t => t.id === tour_id);
    if (!tour) {
      return { content: [{ type: "text", text: `Tour with ID '${tour_id}' not found.` }] };
    }

    const detail =
      `🌴 **${tour.name}**\n\n` +
      `📅 Duration: ${tour.duration}\n` +
      `💰 Price: ₱${tour.price.toLocaleString()} per person\n` +
      `📍 Destination: ${tour.destination}\n` +
      `👥 Available slots: ${tour.slots}\n` +
      `✨ Highlights:\n${tour.highlights.map(h => `   • ${h}`).join("\n")}\n\n` +
      `To book this tour, use the create_booking tool with tour_id: ${tour.id}`;

    return { content: [{ type: "text", text: detail }] };
  }
);

// ============================================================
//  TOOL 3: create_booking
//  Let Base44 AI create a booking on behalf of a traveller
// ============================================================
server.tool(
  "create_booking",
  "Create a new tour booking for a GC Travel customer",
  {
    tour_id:      z.string().describe("Tour ID to book"),
    customer_name: z.string().describe("Full name of the traveller"),
    customer_email: z.string().email().describe("Customer email address"),
    customer_phone: z.string().describe("Customer phone number"),
    travel_date:  z.string().describe("Desired travel date in YYYY-MM-DD format"),
    party_size:   z.number().min(1).max(20).describe("Number of people in the group"),
  },
  async ({ tour_id, customer_name, customer_email, customer_phone, travel_date, party_size }) => {
    const tour = DEMO_TOURS.find(t => t.id === tour_id);
    if (!tour) {
      return { content: [{ type: "text", text: `Tour '${tour_id}' not found.` }] };
    }
    if (tour.slots < party_size) {
      return { content: [{ type: "text", text: `Sorry, only ${tour.slots} slots available for this tour but you need ${party_size}.` }] };
    }

    const bookingId = `BK${Date.now()}`;
    const totalAmount = tour.price * party_size;
    const booking = {
      id: bookingId,
      tourId: tour_id,
      tourName: tour.name,
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      travelDate: travel_date,
      partySize: party_size,
      totalAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    DEMO_BOOKINGS.push(booking);
    // In production: await base44.entities.Booking.create(booking);

    return {
      content: [{
        type: "text",
        text:
          `✅ **Booking Created Successfully!**\n\n` +
          `📋 Booking ID: **${bookingId}**\n` +
          `🌴 Tour: ${tour.name}\n` +
          `👤 Customer: ${customer_name}\n` +
          `📧 Email: ${customer_email}\n` +
          `📅 Travel Date: ${travel_date}\n` +
          `👥 Party Size: ${party_size} pax\n` +
          `💰 Total Amount: ₱${totalAmount.toLocaleString()}\n` +
          `📊 Status: Pending confirmation\n\n` +
          `A confirmation email will be sent to ${customer_email}.`
      }]
    };
  }
);

// ============================================================
//  TOOL 4: check_availability
//  Check if a tour has slots on a specific date
// ============================================================
server.tool(
  "check_availability",
  "Check if a tour package has available slots for a specific date and group size",
  {
    tour_id:    z.string().describe("Tour ID to check"),
    travel_date: z.string().describe("Date to check in YYYY-MM-DD format"),
    party_size: z.number().describe("Number of people"),
  },
  async ({ tour_id, travel_date, party_size }) => {
    const tour = DEMO_TOURS.find(t => t.id === tour_id);
    if (!tour) {
      return { content: [{ type: "text", text: `Tour '${tour_id}' not found.` }] };
    }

    const available = tour.slots >= party_size;
    const msg = available
      ? `✅ **Available!** ${tour.name} has ${tour.slots} slots on ${travel_date}. Your group of ${party_size} can be accommodated.\n\nTotal cost: ₱${(tour.price * party_size).toLocaleString()}`
      : `❌ **Not enough slots.** ${tour.name} only has ${tour.slots} slots available, but you need ${party_size}. Consider a smaller group or a different date.`;

    return { content: [{ type: "text", text: msg }] };
  }
);

// ============================================================
//  TOOL 5: get_booking_status
//  Look up an existing booking by ID
// ============================================================
server.tool(
  "get_booking_status",
  "Look up the status of an existing GC Travel booking",
  {
    booking_id: z.string().describe("The booking ID (e.g. BK1234567890)"),
  },
  async ({ booking_id }) => {
    const booking = DEMO_BOOKINGS.find(b => b.id === booking_id);
    if (!booking) {
      return { content: [{ type: "text", text: `No booking found with ID '${booking_id}'. Please check the ID and try again.` }] };
    }

    return {
      content: [{
        type: "text",
        text:
          `📋 **Booking Status**\n\n` +
          `ID: ${booking.id}\n` +
          `Tour: ${booking.tourName}\n` +
          `Customer: ${booking.customerName}\n` +
          `Travel Date: ${booking.travelDate}\n` +
          `Party Size: ${booking.partySize} pax\n` +
          `Total: ₱${booking.totalAmount.toLocaleString()}\n` +
          `Status: ${booking.status.toUpperCase()}\n` +
          `Booked on: ${new Date(booking.createdAt).toLocaleDateString()}`
      }]
    };
  }
);

// ============================================================
//  Express HTTP server (Streamable HTTP transport)
// ============================================================
const app = express();
app.use(express.json());

// Health check — useful for Railway/Render uptime monitoring
app.get("/", (_req, res) => {
  res.json({
    name:    "GC Travel & Tours MCP Server",
    version: "1.0.0",
    status:  "running",
    tools:   ["search_tours", "get_tour_details", "create_booking", "check_availability", "get_booking_status"],
    mcp_url: `${process.env.BASE_URL || "http://localhost:3000"}/mcp`,
  });
});

// MCP endpoint — this is the URL you paste into Base44
app.all("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🌴 GC Travel & Tours MCP Server running!`);
  console.log(`   Health:  http://localhost:${PORT}/`);
  console.log(`   MCP URL: http://localhost:${PORT}/mcp`);
  console.log(`\n   Paste into Base44 "Add Custom MCP":`);
  console.log(`   ${process.env.BASE_URL || "http://localhost:" + PORT}/mcp\n`);
});
