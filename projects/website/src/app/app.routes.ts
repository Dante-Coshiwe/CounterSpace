import { Routes} from '@angular/router';


export const routes: Routes = [
    {
    path: '',
    pathMatch: 'full',
    loadComponent : () => {
        return import('./home/home').then ((c) => c.Home  )
    }
    },
    {
        path: 'home',
        loadComponent: () => {
            return import('./home/home').then(c => c.Home)
        }
    },
    {
        path: 'about',
        loadComponent: () => {
            return import('./about/about').then(c => c.About)
        }
    },
    {
        path: 'signup',
        loadComponent: () => {
            return import('./signup/signup').then(c => c.SignUp)
        }
    },
    {
        path: 'tutorials',
        loadComponent: () => {
            return import('./tutorials/tutorials').then(c => c.Tutorials)
        }
    },
    {
        path: 'ide',
        loadComponent: () => {
            return import('./ide/ide').then(c => c.Ide)
        }
    },

    // ---------------------------------------
    //       📘 TUTORIAL CATEGORIES
    // ---------------------------------------

    // IDE Tutorials category
    {
        path: 'tutorials/ide',
        loadComponent: () =>
            import('./tutorials/ide-tutorials/ide-tutorials')
                .then(c => c.IdeTutorials)
    },

    // Electronics Tutorials category
    

];
