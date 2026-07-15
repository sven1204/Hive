const { Counter, Gauge } = require('prom-client');

const registrationsTotal = new Counter({
  name: 'hive_registrations_total',
  help: 'Nombre total de comptes créés',
});

const loginsTotal = new Counter({
  name: 'hive_logins_total',
  help: 'Tentatives de connexion',
  labelNames: ['status'], // 'success' | 'failed'
});

const projectsCreatedTotal = new Counter({
  name: 'hive_projects_created_total',
  help: 'Nombre total de projets créés',
});

const projectsClosedTotal = new Counter({
  name: 'hive_projects_closed_total',
  help: 'Nombre total de projets clôturés',
});

const joinRequestsTotal = new Counter({
  name: 'hive_join_requests_total',
  help: 'Demandes de participation',
  labelNames: ['status'], // 'sent' | 'accepted' | 'declined'
});

const messagesSentTotal = new Counter({
  name: 'hive_messages_sent_total',
  help: 'Messages envoyés',
  labelNames: ['type'], // 'direct' | 'group'
});

const socketConnectionsActive = new Gauge({
  name: 'hive_socket_connections_active',
  help: 'Connexions Socket.io actives en ce moment',
});

// Initialise tous les labels à 0 pour qu'ils apparaissent dans /metrics dès le démarrage
loginsTotal.labels('success').inc(0);
loginsTotal.labels('failed').inc(0);
joinRequestsTotal.labels('sent').inc(0);
joinRequestsTotal.labels('accepted').inc(0);
joinRequestsTotal.labels('declined').inc(0);
messagesSentTotal.labels('direct').inc(0);
messagesSentTotal.labels('group').inc(0);

module.exports = {
  registrationsTotal,
  loginsTotal,
  projectsCreatedTotal,
  projectsClosedTotal,
  joinRequestsTotal,
  messagesSentTotal,
  socketConnectionsActive,
};
