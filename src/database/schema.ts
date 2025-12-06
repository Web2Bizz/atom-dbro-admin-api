import { pgTable, serial, varchar, decimal, integer, timestamp, text, jsonb, unique, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { UserRole } from '../user/user.types';

// Регионы
export const regions = pgTable('regions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Города
export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  regionId: integer('region_id').references(() => regions.id).notNull(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Пользователи
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  middleName: varchar('middle_name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  avatarUrls: jsonb('avatar_urls').$type<Record<number, string>>(),
  role: varchar('role', { length: 20 }).default('USER').notNull(),
  level: integer('level').default(1).notNull(),
  experience: integer('experience').default(0).notNull(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Виды помощи
export const helpTypes = pgTable('help_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Категории
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Типы организаций
export const organizationTypes = pgTable('organization_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Организации
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  cityId: integer('city_id').references(() => cities.id).notNull(),
  organizationTypeId: integer('organization_type_id').references(() => organizationTypes.id).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  summary: text('summary'),
  mission: text('mission'),
  description: text('description'),
  goals: jsonb('goals').$type<string[]>(),
  needs: jsonb('needs').$type<string[]>(),
  address: text('address'),
  contacts: jsonb('contacts').$type<Array<{ name: string; value: string }>>(),
  gallery: jsonb('gallery').$type<string[]>(),
  isApproved: boolean('is_approved').default(false).notNull(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Связующая таблица: владельцы организаций
export const organizationOwners = pgTable('organization_owners', {
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
}, (table) => ({
  uniqueOrganizationUser: unique().on(table.organizationId, table.userId),
  uniqueUser: unique().on(table.userId), // Один пользователь может иметь только одну организацию
  uniqueOrganization: unique().on(table.organizationId), // Одна организация может быть указана только один раз
}));

// Связующая таблица: виды помощи организаций
export const organizationHelpTypes = pgTable('organization_help_types', {
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  helpTypeId: integer('help_type_id')
    .references(() => helpTypes.id)
    .notNull(),
});

// Достижения
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  rarity: varchar('rarity', { length: 20 }).notNull(), // 'common' | 'epic' | 'rare' | 'legendary' | 'private'
  questId: integer('quest_id').references(() => quests.id), // Заполняется только если rarity = 'private'
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Связующая таблица: достижения пользователей
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  achievementId: integer('achievement_id')
    .references(() => achievements.id)
    .notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow(),
}, (table) => ({
  uniqueUserAchievement: unique().on(table.userId, table.achievementId),
}));

// Квесты
export const quests = pgTable('quests', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active' | 'completed' | 'archived'
  experienceReward: integer('experience_reward').default(0).notNull(),
  achievementId: integer('achievement_id').references(() => achievements.id),
  ownerId: integer('owner_id').references(() => users.id).notNull(),
  cityId: integer('city_id').references(() => cities.id).notNull(),
  organizationTypeId: integer('organization_type_id').references(() => organizationTypes.id),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  address: text('address'),
  contacts: jsonb('contacts').$type<Array<{ name: string; value: string }>>(),
  coverImage: varchar('cover_image', { length: 500 }),
  gallery: jsonb('gallery').$type<string[]>(),
  steps: jsonb('steps').$type<Array<{
    title: string;
    description?: string;
    status: string;
    progress: number;
    type: 'finance' | 'material' | 'contributers';
    requirement?: {
      currentValue: number;
      targetValue: number;
    };
    deadline?: Date | string;
  }>>(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Связующая таблица: категории квестов
export const questCategories = pgTable('quest_categories', {
  questId: integer('quest_id')
    .references(() => quests.id)
    .notNull(),
  categoryId: integer('category_id')
    .references(() => categories.id)
    .notNull(),
});

// Обновления квестов
export const questUpdates = pgTable('quest_updates', {
  id: serial('id').primaryKey(),
  questId: integer('quest_id')
    .references(() => quests.id)
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  text: text('text').notNull(),
  photos: jsonb('photos').$type<string[]>(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Обновления организаций
export const organizationUpdates = pgTable('organization_updates', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => organizations.id)
    .notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  text: text('text').notNull(),
  photos: jsonb('photos').$type<string[]>(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Связующая таблица: выполнение квестов пользователями
export const userQuests = pgTable('user_quests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  questId: integer('quest_id')
    .references(() => quests.id)
    .notNull(),
  status: varchar('status', { length: 20 }).notNull().default('in_progress'), // 'in_progress' | 'completed' | 'failed'
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  uniqueUserQuest: unique().on(table.userId, table.questId),
}));

// Связующая таблица: волонтёры этапов квестов (только finance и material)
export const questStepVolunteers = pgTable('quest_step_volunteers', {
  id: serial('id').primaryKey(),
  questId: integer('quest_id')
    .references(() => quests.id)
    .notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'finance' | 'material' | 'contributers'
  contributeValue: integer('contribute_value').notNull().default(0),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  isInkognito: boolean('is_inkognito').default(false).notNull(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Связующая таблица: contributers квестов
export const questContributers = pgTable('quest_contributers', {
  id: serial('id').primaryKey(),
  questId: integer('quest_id')
    .references(() => quests.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  recordStatus: varchar('record_status', { length: 20 }).default('CREATED').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const regionsRelations = relations(regions, ({ many }) => ({
  cities: many(cities),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
  region: one(regions, {
    fields: [cities.regionId],
    references: [regions.id],
  }),
  organizations: many(organizations),
  quests: many(quests),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  ownedOrganizations: many(organizationOwners),
  achievements: many(userAchievements),
  quests: many(userQuests),
  ownedQuests: many(quests),
  stepVolunteers: many(questStepVolunteers),
  contributers: many(questContributers),
}));

export const helpTypesRelations = relations(helpTypes, ({ many }) => ({
  organizations: many(organizationHelpTypes),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  quests: many(questCategories),
}));

export const organizationTypesRelations = relations(organizationTypes, ({ many }) => ({
  organizations: many(organizations),
  quests: many(quests),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  city: one(cities, {
    fields: [organizations.cityId],
    references: [cities.id],
  }),
  organizationType: one(organizationTypes, {
    fields: [organizations.organizationTypeId],
    references: [organizationTypes.id],
  }),
  owners: many(organizationOwners),
  helpTypes: many(organizationHelpTypes),
  updates: many(organizationUpdates),
}));

export const organizationOwnersRelations = relations(organizationOwners, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationOwners.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationOwners.userId],
    references: [users.id],
  }),
}));

export const organizationHelpTypesRelations = relations(organizationHelpTypes, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationHelpTypes.organizationId],
    references: [organizations.id],
  }),
  helpType: one(helpTypes, {
    fields: [organizationHelpTypes.helpTypeId],
    references: [helpTypes.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one, many }) => ({
  users: many(userAchievements),
  quest: one(quests, {
    fields: [achievements.questId],
    references: [quests.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const questsRelations = relations(quests, ({ one, many }) => ({
  achievement: one(achievements, {
    fields: [quests.achievementId],
    references: [achievements.id],
  }),
  owner: one(users, {
    fields: [quests.ownerId],
    references: [users.id],
  }),
  city: one(cities, {
    fields: [quests.cityId],
    references: [cities.id],
  }),
  organizationType: one(organizationTypes, {
    fields: [quests.organizationTypeId],
    references: [organizationTypes.id],
  }),
  userQuests: many(userQuests),
  categories: many(questCategories),
  updates: many(questUpdates),
  stepVolunteers: many(questStepVolunteers),
  contributers: many(questContributers),
}));

export const questCategoriesRelations = relations(questCategories, ({ one }) => ({
  quest: one(quests, {
    fields: [questCategories.questId],
    references: [quests.id],
  }),
  category: one(categories, {
    fields: [questCategories.categoryId],
    references: [categories.id],
  }),
}));

export const questUpdatesRelations = relations(questUpdates, ({ one }) => ({
  quest: one(quests, {
    fields: [questUpdates.questId],
    references: [quests.id],
  }),
}));

export const organizationUpdatesRelations = relations(organizationUpdates, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationUpdates.organizationId],
    references: [organizations.id],
  }),
}));

export const userQuestsRelations = relations(userQuests, ({ one }) => ({
  user: one(users, {
    fields: [userQuests.userId],
    references: [users.id],
  }),
  quest: one(quests, {
    fields: [userQuests.questId],
    references: [quests.id],
  }),
}));

export const questStepVolunteersRelations = relations(questStepVolunteers, ({ one }) => ({
  user: one(users, {
    fields: [questStepVolunteers.userId],
    references: [users.id],
  }),
  quest: one(quests, {
    fields: [questStepVolunteers.questId],
    references: [quests.id],
  }),
}));

export const questContributersRelations = relations(questContributers, ({ one }) => ({
  user: one(users, {
    fields: [questContributers.userId],
    references: [users.id],
  }),
  quest: one(quests, {
    fields: [questContributers.questId],
    references: [quests.id],
  }),
}));


