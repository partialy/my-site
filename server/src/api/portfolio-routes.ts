import { Router } from 'express';
import { ok } from './types';
import { parseInput } from './validation';
import { ProfileSettingsService } from '../services/profile-settings.service';
import {
  publicWorkListQuerySchema,
  WorkService,
  workSlugOrUuidSchema,
} from '../services/work.service';

export function createPortfolioPublicRoutes(
  works: WorkService,
  profileSettings: ProfileSettingsService,
): Router {
  const routes = Router();

  routes.get('/portfolio/profile', (_req, res) => {
    const profile = profileSettings.get();
    res.json(ok({
      site: profile.site,
      footer: profile.footer,
      about: {
        ...profile.about,
        worksCount: works.countPublished(),
      },
      showcase: profile.showcase,
    }));
  });

  routes.get('/works', (req, res) => {
    const query = parseInput(publicWorkListQuerySchema, req.query);
    res.json(ok(works.listPublic(query)));
  });

  routes.get('/works/:slugOrUuid', (req, res) => {
    const slugOrUuid = parseInput(workSlugOrUuidSchema, req.params.slugOrUuid);
    res.json(ok(works.getPublicDetail(slugOrUuid)));
  });

  return routes;
}
