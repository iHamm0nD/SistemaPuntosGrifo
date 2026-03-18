import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitasprogramadasComponent } from './citasprogramadas.component';

describe('CitasprogramadasComponent', () => {
  let component: CitasprogramadasComponent;
  let fixture: ComponentFixture<CitasprogramadasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CitasprogramadasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitasprogramadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
