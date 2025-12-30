import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';

export default function FiveMTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      alert('ERREUR SUPABASE: ' + error.message);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '50px', color: 'white', textAlign: 'center'}}>
        <h1>⏳ Chargement...</h1>
      </div>
    );
  }

  return (
    <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px'}}>
      <Head>
        <title>FiveM Project Manager</title>
      </Head>

      <div style={{background: 'white', padding: '30px', borderRadius: '15px', marginBottom: '30px', textAlign: 'center'}}>
        <h1 style={{margin: 0, fontSize: '2.5rem', color: '#667eea'}}>🎮 FiveM Project Manager</h1>
        <p style={{margin: '10px 0 0 0', color: '#666'}}>Gestion collaborative - {tasks.length} tâches</p>
      </div>

      <div style={{background: 'white', padding: '30px', borderRadius: '15px'}}>
        <h2>📋 Liste des tâches</h2>
        {tasks.length === 0 ? (
          <p style={{textAlign: 'center', color: '#999'}}>Aucune tâche pour le moment</p>
        ) : (
          <ul>
            {tasks.map(task => (
              <li key={task.id} style={{marginBottom: '10px'}}>
                <strong>{task.title}</strong> - {task.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
