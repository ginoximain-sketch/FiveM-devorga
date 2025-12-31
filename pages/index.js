import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import styles from '../styles/Dashboard.module.css';

export default function FiveMTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [developers, setDevelopers] = useState(['Dev1', 'Dev2', 'Dev3', 'Dev4']);
  const [loading, setLoading] = useState(true);
  const [newDev, setNewDev] = useState('');
  
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

  // État pour le système de rejet
  const [rejectingTask, setRejectingTask] = useState(null);
  const [bugsList, setBugsList] = useState('');

  useEffect(() => {
  fetchTasks();
  
  // Polling ultra-rapide via notre API (contourne la CSP)
  const interval = setInterval(async () => {
    if (document.visibilityState === 'visible') {
      try {
        const response = await fetch('/api/realtime');
        const { tasks: newTasks } = await response.json();
        if (newTasks) {
          setTasks(newTasks);
        }
      } catch (error) {
        console.error('Erreur polling:', error);
      }
    }
  }, 1000); // Mise à jour toutes les 1 seconde

  return () => clearInterval(interval);
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
      bugs_list: null,
      rejected_by: null,
      rejected_at: null,
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
    if (!task) return;
    
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'en cours',
        assigned_to: devName,
        in_progress_by: devName,
        in_progress_at: new Date().toISOString(),
        bugs_list: null,
        rejected_by: null,
        rejected_at: null,
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
    if (!task) return;
    
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
    if (!task) return;
    
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'approuvé',
        approved_by: devName,
        approved_at: new Date().toISOString(),
        bugs_list: null,
        rejected_by: null,
        rejected_at: null,
        history: [...(task.history || []), {
          action: 'Approuvé et validé',
          by: devName,
          at: new Date().toISOString()
        }]
      })
      .eq('id', taskId);

    if (error) console.error('Erreur:', error);
  };

  const rejectTask = async (taskId, devName) => {
    if (!bugsList.trim()) {
      alert('Veuillez décrire les bugs à corriger');
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'à corriger',
        bugs_list: bugsList,
        rejected_by: devName,
        rejected_at: new Date().toISOString(),
        history: [...(task.history || []), {
          action: 'Rejeté - Bugs à corriger',
          by: devName,
          at: new Date().toISOString(),
          bugs: bugsList
        }]
      })
      .eq('id', taskId);

    if (error) {
      console.error('Erreur:', error);
    } else {
      setRejectingTask(null);
      setBugsList('');
    }
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

  const addDeveloper = () => {
    if (newDev.trim() && !developers.includes(newDev.trim())) {
      setDevelopers([...developers, newDev.trim()]);
      setNewDev('');
    }
  };

  const removeDeveloper = (dev) => {
    if (confirm(`Supprimer ${dev} de la liste ?`)) {
      setDevelopers(developers.filter(d => d !== dev));
    }
  };

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
    aCorreger: tasks.filter(t => t.status === 'à corriger').length,
    scripts: tasks.filter(t => t.type === 'script').length,
    mappings: tasks.filter(t => t.type === 'mapping').length
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'à faire': return '#6c757d';
      case 'en cours': return '#0d6efd';
      case 'en test': return '#fd7e14';
      case 'approuvé': return '#198754';
      case 'à corriger': return '#dc3545';
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
        <header className={styles.header}>
          <h1>🎮 Bastion Project Manager</h1>
          <p>Chargement des données...</p>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Bastion Project Manager</title>
      </Head>

      <header className={styles.header}>
        <h1>🎮 Bastion Project Manager</h1>
        <p>Créé par Ginoxi avec amour ❤️</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>{stats.total}</h3>
          <p>Total Tâches</p>
        </div>
        <div className={styles.statCard} style={{borderLeft: '4px solid #6c757d'}}>
          <h3>{stats.aFaire}</h3>
          <p>À Faire</p>
        </div>
        <div className={styles.statCard} style={{borderLeft: '4px solid #0d6efd'}}>
          <h3>{stats.enCours}</h3>
          <p>En Cours</p>
        </div>
        <div className={styles.statCard} style={{borderLeft: '4px solid #fd7e14'}}>
          <h3>{stats.enTest}</h3>
          <p>En Test</p>
        </div>
        <div className={styles.statCard} style={{borderLeft: '4px solid #dc3545'}}>
          <h3>{stats.aCorreger}</h3>
          <p>À Corriger</p>
        </div>
        <div className={styles.statCard} style={{borderLeft: '4px solid #198754'}}>
          <h3>{stats.approuve}</h3>
          <p>Approuvés</p>
        </div>
        <div className={styles.statCard}>
          <h3>{stats.scripts}/{stats.mappings}</h3>
          <p>Scripts/Mappings</p>
        </div>
      </div>

      <div className={styles.devSection}>
        <h3>👥 Équipe de développement</h3>
        <div className={styles.devList}>
          {developers.map(dev => (
            <span key={dev} className={styles.devBadge}>
              {dev}
              <button onClick={() => removeDeveloper(dev)}>×</button>
            </span>
          ))}
        </div>
        <div className={styles.addDevForm}>
          <input
            type="text"
            placeholder="Ajouter un développeur..."
            value={newDev}
            onChange={(e) => setNewDev(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addDeveloper()}
          />
          <button onClick={addDeveloper}>+ Ajouter</button>
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.btnPrimary}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Fermer' : '+ Nouvelle Tâche'}
        </button>
      </div>

      {showForm && (
        <div className={styles.taskForm}>
          <h3>Créer une nouvelle tâche</h3>
          <form onSubmit={addTask}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Titre de la tâche *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Système de banque..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Type *</label>
                <select
                  value={taskForm.type}
                  onChange={(e) => setTaskForm({...taskForm, type: e.target.value})}
                >
                  <option value="script">📜 Script</option>
                  <option value="mapping">🗺️ Mapping</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Priorité</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                >
                  <option value="haute">🔴 Haute</option>
                  <option value="moyenne">🟡 Moyenne</option>
                  <option value="basse">🟢 Basse</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Créé par *</label>
                <select
                  required
                  value={taskForm.created_by}
                  onChange={(e) => setTaskForm({...taskForm, created_by: e.target.value})}
                >
                  <option value="">Sélectionner...</option>
                  {developers.map(dev => (
                    <option key={dev} value={dev}>{dev}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Description courte</label>
              <textarea
                rows="2"
                placeholder="Description rapide..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Détails complets</label>
              <textarea
                rows="5"
                placeholder="Détails techniques..."
                value={taskForm.details}
                onChange={(e) => setTaskForm({...taskForm, details: e.target.value})}
              />
            </div>

            <button type="submit" className={styles.btnSuccess}>
              ✓ Créer la tâche
            </button>
          </form>
        </div>
      )}

      <div className={styles.filters}>
        <select 
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value})}
        >
          <option value="tous">Tous types</option>
          <option value="script">Scripts uniquement</option>
          <option value="mapping">Mappings uniquement</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="tous">Tous statuts</option>
          <option value="à faire">À faire</option>
          <option value="en cours">En cours</option>
          <option value="en test">En test</option>
          <option value="à corriger">À corriger</option>
          <option value="approuvé">Approuvés</option>
        </select>

        <select
          value={filters.developer}
          onChange={(e) => setFilters({...filters, developer: e.target.value})}
        >
          <option value="tous">Tous les devs</option>
          {developers.map(dev => (
            <option key={dev} value={dev}>{dev}</option>
          ))}
        </select>
      </div>

      <div className={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>📋 Aucune tâche pour le moment. Créez-en une !</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className={styles.taskCard}>
              <div className={styles.taskHeader}>
                <div>
                  <h4>
                    {task.type === 'script' ? '📜' : '🗺️'} {task.title}
                  </h4>
                  <div className={styles.taskMeta}>
                    <span 
                      className={styles.badge}
                      style={{backgroundColor: getStatusColor(task.status)}}
                    >
                      {task.status.toUpperCase()}
                    </span>
                    <span 
                      className={styles.badge}
                      style={{backgroundColor: getPriorityColor(task.priority)}}
                    >
                      Priorité {task.priority}
                    </span>
                  </div>
                </div>
                <button 
                  className={styles.btnDelete}
                  onClick={() => deleteTask(task.id)}
                >
                  🗑️
                </button>
              </div>

              {task.description && (
                <p className={styles.taskDescription}>{task.description}</p>
              )}

              {task.details && (
                <div className={styles.taskDetails}>
                  <strong>Détails:</strong>
                  <p>{task.details}</p>
                </div>
              )}

              {task.bugs_list && (
                <div className={styles.bugsAlert}>
                  <strong>🐛 Bugs à corriger :</strong>
                  <p>{task.bugs_list}</p>
                  <small>Rejeté par {task.rejected_by} le {new Date(task.rejected_at).toLocaleString('fr-FR')}</small>
                </div>
              )}

              <div className={styles.workflow}>
                <div className={styles.workflowStep}>
                  <strong>💡 Idée:</strong> {task.created_by}
                </div>
                
                {task.in_progress_by && (
                  <div className={styles.workflowStep}>
                    <strong>⚙️ Traité par:</strong> {task.in_progress_by}
                  </div>
                )}

                {task.tested_by && (
                  <div className={styles.workflowStep}>
                    <strong>🧪 Testé par:</strong> {task.tested_by}
                  </div>
                )}

                {task.rejected_by && (
                  <div className={styles.workflowStep}>
                    <strong>❌ Rejeté par:</strong> {task.rejected_by}
                  </div>
                )}

                {task.approved_by && (
                  <div className={styles.workflowStep}>
                    <strong>✅ Approuvé par:</strong> {task.approved_by}
                  </div>
                )}
              </div>

              <div className={styles.taskActions}>
                {(task.status === 'à faire' || task.status === 'à corriger') && (
                  <div className={styles.actionGroup}>
                    <label>Prendre en charge:</label>
                    <select onChange={(e) => e.target.value && takeTask(task.id, e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {developers.map(dev => (
                        <option key={dev} value={dev}>{dev}</option>
                      ))}
                    </select>
                  </div>
                )}

                {task.status === 'en cours' && (
                  <div className={styles.actionGroup}>
                    <label>Marquer comme testé:</label>
                    <select onChange={(e) => e.target.value && markAsTested(task.id, e.target.value)}>
                      <option value="">Sélectionner...</option>
                      {developers.map(dev => (
                        <option key={dev} value={dev}>{dev}</option>
                      ))}
                    </select>
                  </div>
                )}

                {task.status === 'en test' && (
                  <>
                    {rejectingTask === task.id ? (
                      <div className={styles.rejectForm}>
                        <h4>🐛 Liste des bugs à corriger :</h4>
                        <textarea
                          rows="4"
                          placeholder="Décrivez les bugs trouvés..."
                          value={bugsList}
                          onChange={(e) => setBugsList(e.target.value)}
                          className={styles.bugsTextarea}
                        />
                        <div className={styles.rejectActions}>
                          <select onChange={(e) => e.target.value && rejectTask(task.id, e.target.value)}>
                            <option value="">Qui rejette ?</option>
                            {developers.map(dev => (
                              <option key={dev} value={dev}>{dev}</option>
                            ))}
                          </select>
                          <button 
                            onClick={() => {
                              setRejectingTask(null);
                              setBugsList('');
                            }}
                            className={styles.btnCancel}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.approvalActions}>
                        <div className={styles.actionGroup}>
                          <label>✅ Approuver:</label>
                          <select onChange={(e) => e.target.value && approveTask(task.id, e.target.value)}>
                            <option value="">Sélectionner...</option>
                            {developers.map(dev => (
                              <option key={dev} value={dev}>{dev}</option>
                            ))}
                          </select>
                        </div>
                        <button 
                          onClick={() => setRejectingTask(task.id)}
                          className={styles.btnReject}
                        >
                          ❌ Rejeter (bugs trouvés)
                        </button>
                      </div>
                    )}
                  </>
                )}

                {task.status === 'approuvé' && (
                  <div className={styles.approvedMessage}>
                    ✅ Tâche complétée !
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
