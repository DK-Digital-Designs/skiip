import { useState, useEffect } from 'react'
import { supabase } from './supabase-example'

/**
 * Example Todo App Component provided by Supabase Guide
 * This is for reference only and is not used in the main Skiip app.
 */
export default function TodoExample() {
  const [todos, setTodos] = useState([])

  useEffect(() => {
    async function getTodos() {
      // Note: This requires a 'todos' table to exist in your database
      const { data: todos } = await supabase.from('todos').select()

      if (todos) {
        setTodos(todos)
      }
    }

    getTodos()
  }, [])

  return (
    <div style={{ padding: '20px', background: 'white', color: 'black', borderRadius: '8px', margin: '20px' }}>
      <h2>Todo Example</h2>
      <ul>
        {todos.map((todo: any) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
        {todos.length === 0 && <p>No todos found. Create a 'todos' table in Supabase to see results.</p>}
      </ul>
    </div>
  )
}
