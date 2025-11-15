#!/bin/bash
# Start React Frontend on port 3000

cd "/Users/melaniepham/Documents/Viet/HK1 Năm 3/CUOI KY/11_11cuoiky/client"

echo "🚀 Starting React Frontend..."
echo "📍 Port: 3000"
echo "🌐 URL: http://localhost:3000"
echo ""

REACT_APP_API_URL=http://localhost:5000 \
REACT_APP_SOCKET_URL=http://localhost:5000 \
npm start
