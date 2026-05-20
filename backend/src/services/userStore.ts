import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { User } from '../types/user.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readUsers(): User[] {
  ensureDataDir()
  if (!fs.existsSync(USERS_FILE)) return []
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeUsers(users: User[]) {
  ensureDataDir()
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

export function findByEmail(email: string): User | undefined {
  return readUsers().find(u => u.email.toLowerCase() === email.toLowerCase())
}

export function findById(id: string): User | undefined {
  return readUsers().find(u => u.id === id)
}

export function createUser(user: User): User {
  const users = readUsers()
  users.push(user)
  writeUsers(users)
  return user
}

export function emailExists(email: string): boolean {
  return !!findByEmail(email)
}
