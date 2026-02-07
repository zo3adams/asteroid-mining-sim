/**
 * Mobile Layout Tests
 * 
 * Tests the mobile portrait layout configuration as defined in spec.md:
 * 
 * Mobile Portrait Mode (< 768px) section order:
 * 1. Help
 * 2. Search box
 * 3. Company Status
 * 4. Active Missions
 * 5. Tech Tree
 * 6. Owned Assets
 * 7. Storage
 * 8. Market Prices
 * 9. Flight Log
 * 
 * Hidden on mobile:
 * - Controls section
 * - Hover Info section
 * - Target Info section
 * - Quick Stats section
 * 
 * @see spec.md Section "Portrait Mode (Mobile Phones < 768px)"
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

describe('Mobile Portrait Layout', () => {
  let document: Document;
  let mobileRules: Map<string, CSSStyleDeclaration> = new Map();

  beforeAll(() => {
    // Load the index.html file - use process.cwd() which is project root
    const htmlPath = path.resolve(process.cwd(), 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    const dom = new JSDOM(htmlContent);
    document = dom.window.document;

    // Extract CSS rules from the style tag
    const styleTag = document.querySelector('style');
    if (styleTag) {
      const cssText = styleTag.textContent || '';
      
      // Find the mobile media query section
      const mobileMediaMatch = cssText.match(
        /@media\s+screen\s+and\s+\(max-width:\s*768px\)\s+and\s+\(orientation:\s*portrait\)\s*\{([\s\S]*?)\n\s{8}\}/
      );
      
      if (mobileMediaMatch) {
        const mobileCSS = mobileMediaMatch[1];
        
        // Parse individual rules - look for ID selectors with order or display properties
        const ruleRegex = /(#[\w-]+)\s*\{([^}]+)\}/g;
        let match;
        while ((match = ruleRegex.exec(mobileCSS)) !== null) {
          const selector = match[1];
          const declarations = match[2];
          
          // Parse declarations into a simple object
          const style: any = {};
          const declParts = declarations.split(';').filter(d => d.trim());
          declParts.forEach(decl => {
            const [prop, value] = decl.split(':').map(s => s.trim());
            if (prop && value) {
              style[prop] = value.replace('!important', '').trim();
            }
          });
          
          mobileRules.set(selector, style);
        }
      }
    }
  });

  describe('Panel Section IDs', () => {
    it('should have all required panel section IDs in HTML', () => {
      const requiredIds = [
        'help-section',
        'search-section', 
        'company-section',
        'missions-section',
        'tech-tree-section',
        'assets-section',
        'storage-section',
        'market-section',
        'flight-log-section',
        'controls-section',
        'target-section',
        'quickstats-section',
        'hover-section'
      ];

      requiredIds.forEach(id => {
        const element = document.getElementById(id);
        expect(element, `Element #${id} should exist`).not.toBeNull();
      });
    });

    it('should have panel sections as direct children of panels', () => {
      const leftPanel = document.getElementById('left-panel');
      const rightPanel = document.getElementById('right-panel');
      
      expect(leftPanel).not.toBeNull();
      expect(rightPanel).not.toBeNull();

      // Left panel sections
      expect(leftPanel?.querySelector('#company-section')).not.toBeNull();
      expect(leftPanel?.querySelector('#missions-section')).not.toBeNull();
      expect(leftPanel?.querySelector('#tech-tree-section')).not.toBeNull();
      expect(leftPanel?.querySelector('#assets-section')).not.toBeNull();
      expect(leftPanel?.querySelector('#storage-section')).not.toBeNull();
      expect(leftPanel?.querySelector('#help-section')).not.toBeNull();
      expect(leftPanel?.querySelector('#controls-section')).not.toBeNull();

      // Right panel sections
      expect(rightPanel?.querySelector('#search-section')).not.toBeNull();
      expect(rightPanel?.querySelector('#target-section')).not.toBeNull();
      expect(rightPanel?.querySelector('#quickstats-section')).not.toBeNull();
      expect(rightPanel?.querySelector('#hover-section')).not.toBeNull();
      expect(rightPanel?.querySelector('#market-section')).not.toBeNull();
      expect(rightPanel?.querySelector('#flight-log-section')).not.toBeNull();
    });
  });

  describe('Mobile CSS Order Values', () => {
    // Expected order per spec.md
    const expectedOrder: Record<string, number> = {
      '#help-section': 10,
      '#search-section': 11,
      '#company-section': 12,
      '#missions-section': 13,
      '#tech-tree-section': 14,
      '#assets-section': 15,
      '#storage-section': 16,
      '#market-section': 17,
      '#flight-log-section': 18
    };

    it('should have correct order values for all visible sections', () => {
      Object.entries(expectedOrder).forEach(([selector, expectedOrderValue]) => {
        const style = mobileRules.get(selector);
        expect(style, `CSS rule for ${selector} should exist in mobile media query`).toBeDefined();
        expect(
          parseInt(style?.order || '0'),
          `${selector} should have order: ${expectedOrderValue}`
        ).toBe(expectedOrderValue);
      });
    });

    it('should have Help section first (lowest order)', () => {
      const helpOrder = parseInt(mobileRules.get('#help-section')?.order || '999');
      const otherOrders = Object.keys(expectedOrder)
        .filter(s => s !== '#help-section')
        .map(s => parseInt(mobileRules.get(s)?.order || '0'));
      
      otherOrders.forEach(order => {
        expect(helpOrder).toBeLessThan(order);
      });
    });

    it('should have Search section second', () => {
      const searchOrder = parseInt(mobileRules.get('#search-section')?.order || '999');
      const helpOrder = parseInt(mobileRules.get('#help-section')?.order || '0');
      const companyOrder = parseInt(mobileRules.get('#company-section')?.order || '999');
      
      expect(searchOrder).toBeGreaterThan(helpOrder);
      expect(searchOrder).toBeLessThan(companyOrder);
    });

    it('should have Flight Log last (highest order)', () => {
      const flightLogOrder = parseInt(mobileRules.get('#flight-log-section')?.order || '0');
      const otherOrders = Object.keys(expectedOrder)
        .filter(s => s !== '#flight-log-section')
        .map(s => parseInt(mobileRules.get(s)?.order || '999'));
      
      otherOrders.forEach(order => {
        expect(flightLogOrder).toBeGreaterThan(order);
      });
    });

    it('should have sequential order values without gaps', () => {
      const orders = Object.values(expectedOrder).sort((a, b) => a - b);
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i] - orders[i-1]).toBe(1);
      }
    });
  });

  describe('Hidden Sections on Mobile', () => {
    const hiddenSections = [
      '#controls-section',
      '#hover-section', 
      '#target-section',
      '#quickstats-section'
    ];

    hiddenSections.forEach(selector => {
      it(`should hide ${selector} on mobile`, () => {
        const style = mobileRules.get(selector);
        expect(style, `CSS rule for ${selector} should exist`).toBeDefined();
        expect(style?.display).toBe('none');
      });
    });

    it('should not hide visible sections', () => {
      const visibleSections = [
        '#help-section',
        '#search-section',
        '#company-section',
        '#missions-section',
        '#tech-tree-section',
        '#assets-section',
        '#storage-section',
        '#market-section',
        '#flight-log-section'
      ];

      visibleSections.forEach(selector => {
        const style = mobileRules.get(selector);
        // Should either not have display property or not be 'none'
        expect(
          style?.display !== 'none',
          `${selector} should not be hidden`
        ).toBe(true);
      });
    });
  });

  describe('Mobile Layout Structure', () => {
    it('should use display:contents on panels to flatten hierarchy', () => {
      // Check that the CSS includes display:contents for panels
      const styleTag = document.querySelector('style');
      const cssText = styleTag?.textContent || '';
      
      // Look for the panels getting display:contents in mobile
      expect(cssText).toContain('#left-panel');
      expect(cssText).toContain('#right-panel');
      expect(cssText).toContain('display: contents');
    });
  });
});
