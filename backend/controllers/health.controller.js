/* Vérifie que l'API est opérationnelle — utilisé pour les health checks (Prometheus, load balancer, etc.) */
export const getHealth = (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
};

