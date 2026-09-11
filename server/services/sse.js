let clients = [];

export function addClient(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
}

export function broadcastMood(mood) {
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify({ mood })}\n\n`);
  });
}
