import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlocklyEditor } from './blockly-editor';

describe('BlocklyEditor', () => {
  let component: BlocklyEditor;
  let fixture: ComponentFixture<BlocklyEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlocklyEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlocklyEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
