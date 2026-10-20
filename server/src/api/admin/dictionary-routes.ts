import { Router } from 'express';
import { ok } from '../types';
import { parseInput } from '../validation';
import { requireAuth } from '../../middleware/auth.middleware';
import { AuthService } from '../../services/auth.service';
import {
  DictionaryService, createDictionarySchema, updateDictionarySchema,
  createDictionaryItemSchema, updateDictionaryItemSchema, dictionaryIdSchema, dictionaryCodesSchema,
} from '../../services/dictionary.service';

export function createAdminDictionaryRoutes(auth: AuthService, dictionaries: DictionaryService): Router {
  const routes = Router();
  routes.use(requireAuth(auth));

  routes.get('/', (_req, res) => res.json(ok(dictionaries.list())));

  routes.get('/options', (req, res) => {
    const { codes } = parseInput(dictionaryCodesSchema, req.query);
    res.json(ok(dictionaries.getOptions(codes, false)));
  });

  routes.post('/', (req, res) => {
    const input = parseInput(createDictionarySchema, req.body);
    const type = dictionaries.createType(input);
    res.locals.operationTargetId = String(type.id);
    res.status(201).json(ok(type, '字典类型已创建'));
  });

  routes.put('/:id', (req, res) => {
    const id = parseInput(dictionaryIdSchema, req.params.id);
    const type = dictionaries.updateType(id, parseInput(updateDictionarySchema, req.body));
    res.locals.operationTargetId = String(type.id);
    res.json(ok(type, '字典类型已更新'));
  });

  routes.post('/:id/items', (req, res) => {
    const typeId = parseInput(dictionaryIdSchema, req.params.id);
    const item = dictionaries.createItem(typeId, parseInput(createDictionaryItemSchema, req.body));
    res.locals.operationTargetId = String(item.id);
    res.status(201).json(ok(item, '字典子项已创建'));
  });

  routes.put('/:id/items/:itemId', (req, res) => {
    const typeId = parseInput(dictionaryIdSchema, req.params.id);
    const itemId = parseInput(dictionaryIdSchema, req.params.itemId);
    const item = dictionaries.updateItem(typeId, itemId, parseInput(updateDictionaryItemSchema, req.body));
    res.locals.operationTargetId = String(item.id);
    res.json(ok(item, '字典子项已更新'));
  });

  return routes;
}
