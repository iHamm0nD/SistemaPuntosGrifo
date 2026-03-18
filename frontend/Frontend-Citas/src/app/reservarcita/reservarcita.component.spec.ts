import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservarcitaComponent } from './reservarcita.component';

describe('ReservarcitaComponent', () => {
  let component: ReservarcitaComponent;
  let fixture: ComponentFixture<ReservarcitaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReservarcitaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservarcitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
