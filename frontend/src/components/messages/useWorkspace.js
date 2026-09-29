import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { useSocket } from "../../context/SocketContext";

/* Données de l'espace projet d'un groupe : tâches, rendez-vous et messages épinglés.
   Rechargement silencieux quand un membre modifie quelque chose (événements socket). */
export default function useWorkspace(convId) {
  const socket = useSocket();
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState({ tasks: [], events: [], pinned: [] });
  const [actionError, setActionError] = useState(false);
  const aliveRef = useRef(true);
  useEffect(() => {
    // StrictMode (dev) monte, démonte puis remonte : on remet le drapeau à chaque montage
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!convId) return;
    if (!silent) setStatus("loading");
    try {
      const [workspace, pinned] = await Promise.all([
        api(`/workspace/${convId}`),
        api(`/messages/group/${convId}/pinned`),
      ]);
      if (!aliveRef.current) return;
      setData({
        tasks: Array.isArray(workspace?.tasks) ? workspace.tasks : [],
        events: Array.isArray(workspace?.events) ? workspace.events : [],
        pinned: Array.isArray(pinned) ? pinned : [],
      });
      setStatus("ready");
    } catch (err) {
      console.error(err);
      if (aliveRef.current && !silent) setStatus("error");
    }
  }, [convId]);

  useEffect(() => { load(false); }, [load]);

  useEffect(() => {
    if (!socket || !convId) return undefined;
    const mine = (payload) => String(payload?.conversationId) === String(convId);
    const onWorkspace = (payload) => { if (mine(payload)) load(true); };
    const onPinned = (payload) => { if (mine(payload)) load(true); };
    socket.on("workspace_updated", onWorkspace);
    socket.on("message_pinned", onPinned);
    return () => {
      socket.off("workspace_updated", onWorkspace);
      socket.off("message_pinned", onPinned);
    };
  }, [socket, convId, load]);

  /* Exécute une action puis recharge ; renvoie true si elle a réussi */
  const run = useCallback(async (request) => {
    setActionError(false);
    try {
      await request();
      await load(true);
      return true;
    } catch (err) {
      console.error(err);
      if (aliveRef.current) setActionError(true);
      return false;
    }
  }, [load]);

  /* Mise à jour immédiate de l'affichage, confirmée (ou annulée) par le rechargement */
  const optimistic = (patch, request) => {
    setData((prev) => patch(prev));
    return run(request).then((ok) => {
      if (!ok) load(true);
      return ok;
    });
  };

  const base = `/workspace/${convId}`;
  const send = (path, method, body) => api(path, { method, body: body ? JSON.stringify(body) : undefined });

  return {
    status,
    ...data,
    actionError,
    clearActionError: () => setActionError(false),
    reload: () => load(false),
    addTask: (task) => run(() => send(`${base}/tasks`, "POST", task)),
    toggleTask: (task) => optimistic(
      (prev) => ({ ...prev, tasks: prev.tasks.map((x) => (x._id === task._id ? { ...x, done: !task.done } : x)) }),
      () => send(`${base}/tasks/${task._id}`, "PATCH", { done: !task.done }),
    ),
    deleteTask: (task) => run(() => send(`${base}/tasks/${task._id}`, "DELETE")),
    addEvent: (event) => run(() => send(`${base}/events`, "POST", event)),
    rsvp: (event, status, myId) => optimistic(
      (prev) => ({
        ...prev,
        events: prev.events.map((ev) => (ev._id !== event._id ? ev : {
          ...ev,
          rsvps: [...ev.rsvps.filter((r) => String(r.userId?._id || r.userId) !== String(myId)), { userId: { _id: myId }, status }],
        })),
      }),
      () => send(`${base}/events/${event._id}/rsvp`, "PUT", { status }),
    ),
    deleteEvent: (event) => run(() => send(`${base}/events/${event._id}`, "DELETE")),
    unpin: (msg) => run(() => send(`/messages/${msg._id}/pin`, "PUT", { pinned: false })),
  };
}
