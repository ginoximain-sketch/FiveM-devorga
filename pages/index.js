import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import styles from '../styles/Dashboard.module.css';

export default function FiveMTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState(['Dev1', 'Dev2', 'Dev3', 'Dev4']);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    type: 'script',
    description: '',
    details: '',
    priority: 'moyenne',
    created_by: ''
  });

  const [filters, setFilters] = useState({
    type: 'tous',
    status: 'tous',
    developer: 'tous'
  });

  // Charger les tâches depuis Supabase
  useEffect(() => {
    fetchTasks();
    
    // Écouter les changements en temps réel
    const subscription = supabase
      .channel('tasks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Changement détecté!', payload);
          fetchTasks(); // Recharger les tâches
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erreur:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.created_by) {
      alert('Veuillez remplir au moins le titre et votre nom');
      return;
    }

    const newTask = {
      ...taskForm,
      status: 'à faire',
      history: [{
        action: 'Tâche créée',
        by: taskForm.created_by,
        at: new Date().toISOString()
      }]
    };

    const { error } = await supabase
      .from('tasks')
      .insert([newTask]);

    if (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création');
    } else {
      setTaskForm({
        title: '',
        type: 'script',
        description: '',
        details: '',
        priority: 'moyenne',
        created_by: ''
      });
      setShowForm(false);
    }
  };

  const takeTask = async (taskId, devName) => {
    const task = tasks.find(t => t.id === taskId);
    
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'en cours',
        assigned_to: devName,
        in_progress_by: devName,
        in_progress_at: new Date().toISOString(),
        history: [...(task.history || []), {
          action: 'Prise en charge',
          by: devName,
          at: new Date().toISOString()
        }]
      })
      .eq('id', taskId);

    if (error) console.error('Erreur:', error);
  };

  const markAsTested = async (taskId, devName) => {
    const task = tasks.find(t => t.id === taskId);
    
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'en test',
        tested_by: devName,
        tested_at: new Date().toISOString(),
        history: [...(task.history || []), {
          action: 'Mis en test',
          by: devName,
          at: new Date().toISOString()
        }]
      })
      .eq('id', taskId);

    if (error) console.error('Erreur:', error);
  };

  const approveTask = async (taskId, devName) => {
    const task = tasks.find(t => t.id === taskId);
    
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'approuvé',
        approved_by: devName,
        approved_at: new Date().toISOString(),
        history: [...(task.history || []), {
          action: 'Approuvé et validé',
          by: devName,
          at: new Date().toISOString()
        }]
      })
      .eq('id', taskId);

    if (error) console.error('Erreur:', error);
  };

  const deleteTask = async (taskId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) console.error('Erreur:', error);
    }
  };

  // Reste du code identique (filtres, stats, render...)
  const filteredTasks = tasks.filter(task => {
    if (filters.type !== 'tous' && task.type !== filters.type) return false;
    if (filters.status !== 'tous' && task.status !== filters.status) return false;
    if (filters.developer !== 'tous' && task.assigned_to !== filters.developer) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    aFaire: tasks.filter(t => t.status === 'à faire').length,
    enCours: tasks.filter(t => t.status === 'en cours').length,
    enTest: tasks.filter(t => t.status === 'en test').length,
    approuve: tasks.filter(t => t.status === 'approuvé').length,
    scripts: tasks.filter(t => t.type === 'script').length,
    mappings: tasks.filter(t => t.type === 'mapping').length
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'à faire': return '#6c757d';
      case 'en cours': return '#0d6efd';
      case 'en test': return '#fd7e14';
      case 'approuvé': return '#198754';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'haute': return '#dc3545';
      case 'moyenne': return '#ffc107';
      case 'basse': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{textAlign: 'center', padding: '100px', color: 'white'}}>
          <h2>Chargement...</h2>
        </div>
      </div>
    );
  }

  // Tout le reste du JSX identique à avant...
  return (
    <div className={styles.container}>
      <Head>
        <title>FiveM Project Manager - Gestion de Développement</title>
      </Head>

      <header className={styles.header}>
        <h1>🎮 FiveM Project Manager</h1>
        <p>Gestion collaborative du développement serveur - 🔴 EN TEMPS RÉEL</p>
      </header>

      {/* Tout le reste du code JSX identique */}
      {/* ... (stats, formulaire, liste des tâches) */}
    </div>
  );
}
