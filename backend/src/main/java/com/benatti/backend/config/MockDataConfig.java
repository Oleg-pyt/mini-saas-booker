package com.benatti.backend.config;

import com.benatti.backend.entity.OrganisationEntity;
import com.benatti.backend.entity.OrganisationMember;
import com.benatti.backend.entity.OrganisationScheduleEntity;
import com.benatti.backend.entity.OrganisationServiceEntity;
import com.benatti.backend.entity.UserRole;
import com.benatti.backend.entity.UserEntity;
import com.benatti.backend.repository.OrganisationsDAO;
import com.benatti.backend.repository.UsersDAO;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class MockDataConfig {
    @Bean
    public ApplicationRunner seedDefaultData(
            UsersDAO usersDAO,
            OrganisationsDAO organisationsDAO,
            PasswordEncoder passwordEncoder
    ) {
        return (_args) -> {
            UserEntity admin = ensureUser(usersDAO, passwordEncoder, "admin", "Admin User", "admin@booker.app", "admin", UserRole.BUSINESS_OWNER);
            UserEntity staff = ensureUser(usersDAO, passwordEncoder, "staff", "Staff Member", "staff@booker.app", "staff", UserRole.USER);

            seedOrganisation(
                    organisationsDAO,
                    admin,
                    staff,
                    "bold-cut-barbershop",
                    "Bold Cut Barbershop",
                    "Barbershop",
                    "Kyiv",
                    "12 Khreshchatyk St",
                    "Sharp cuts, beard grooming, and premium barber rituals for a polished city look.",
                    4.9,
                    214,
                    "https://images.unsplash.com/photo-1512690459411-b0fd1c86b8ac?auto=format&fit=crop&w=1200&q=80",
                    List.of(
                            createService("Haircut", "Classic or modern haircut tailored to your style.", 60, 900),
                            createService("Beard Trim", "Precision beard shaping with hot towel finish.", 45, 650),
                            createService("Full Grooming", "Haircut, beard trim, and styling in one session.", 90, 1400)
                    ),
                    defaultSchedule(10, 20, 30)
            );

            seedOrganisation(
                    organisationsDAO,
                    admin,
                    null,
                    "lime-nails-studio",
                    "Lime Nails Studio",
                    "Nail Salon",
                    "Lviv",
                    "28 Shevchenka Ave",
                    "Express manicures, signature nail art, and polished appointments in a bright studio.",
                    4.8,
                    167,
                    "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80",
                    List.of(
                            createService("Express Manicure", "Quick manicure for busy schedules.", 45, 700),
                            createService("Gel Manicure", "Long-lasting gel finish with precise care.", 75, 1100),
                            createService("Nail Art Session", "Custom art design and premium finish.", 90, 1450)
                    ),
                    defaultSchedule(9, 19, 30)
            );

            seedOrganisation(
                    organisationsDAO,
                    admin,
                    null,
                    "smile-clinic",
                    "Smile Clinic",
                    "Dental Care",
                    "Kyiv",
                    "7 Saksahanskoho St",
                    "Private dental clinic focused on consultations, hygiene, and whitening appointments.",
                    4.7,
                    121,
                    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
                    List.of(
                            createService("Consultation", "Initial dental consultation with treatment plan.", 30, 600),
                            createService("Professional Cleaning", "Hygiene cleaning session with dentist review.", 60, 1300),
                            createService("Whitening", "In-clinic whitening for a brighter smile.", 75, 2600)
                    ),
                    defaultSchedule(8, 18, 30)
            );
        };
    }

    private UserEntity ensureUser(
            UsersDAO usersDAO,
            PasswordEncoder passwordEncoder,
            String login,
            String name,
            String email,
            String rawPassword,
            UserRole role
    ) {
        return usersDAO.findByLogin(login).map(existing -> {
            if (existing.getRole() != role) {
                existing.setRole(role);
                return usersDAO.save(existing);
            }
            return existing;
        }).orElseGet(() -> {
            UserEntity user = new UserEntity();
            user.setName(name);
            user.setLogin(login);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            return usersDAO.save(user);
        });
    }

    private void seedOrganisation(
            OrganisationsDAO organisationsDAO,
            UserEntity owner,
            UserEntity staff,
            String slug,
            String name,
            String type,
            String city,
            String address,
            String description,
            double rating,
            int reviewsCount,
            String coverImageUrl,
            List<OrganisationServiceEntity> services,
            List<OrganisationScheduleEntity> schedules
    ) {
        if (organisationsDAO.findBySlug(slug).isPresent()) {
            return;
        }

        OrganisationEntity organisation = new OrganisationEntity();
        organisation.setSlug(slug);
        organisation.setName(name);
        organisation.setType(type);
        organisation.setCity(city);
        organisation.setAddress(address);
        organisation.setDescription(description);
        organisation.setRating(rating);
        organisation.setReviewsCount(reviewsCount);
        organisation.setCoverImageUrl(coverImageUrl);
        organisation.setUserEntity(owner);

        for (OrganisationServiceEntity service : services) {
            service.setOrganisation(organisation);
            organisation.getServices().add(service);
        }

        for (OrganisationScheduleEntity schedule : schedules) {
            schedule.setOrganisation(organisation);
            organisation.getSchedules().add(schedule);
        }

        if (staff != null) {
            OrganisationMember organisationMember = new OrganisationMember();
            organisationMember.setOrganisation(organisation);
            organisationMember.setUser(staff);
            organisation.getMembers().add(organisationMember);
        }

        organisationsDAO.save(organisation);
    }

    private OrganisationServiceEntity createService(String name, String description, int durationMinutes, int price) {
        OrganisationServiceEntity service = new OrganisationServiceEntity();
        service.setName(name);
        service.setDescription(description);
        service.setDurationMinutes(durationMinutes);
        service.setPrice(price);
        service.setIsActive(true);
        return service;
    }

    private List<OrganisationScheduleEntity> defaultSchedule(int openingHour, int closingHour, int slotStepMinutes) {
        return List.of(
                createSchedule(DayOfWeek.MONDAY, true, openingHour, closingHour, slotStepMinutes),
                createSchedule(DayOfWeek.TUESDAY, true, openingHour, closingHour, slotStepMinutes),
                createSchedule(DayOfWeek.WEDNESDAY, true, openingHour, closingHour, slotStepMinutes),
                createSchedule(DayOfWeek.THURSDAY, true, openingHour, closingHour, slotStepMinutes),
                createSchedule(DayOfWeek.FRIDAY, true, openingHour, closingHour, slotStepMinutes),
                createSchedule(DayOfWeek.SATURDAY, true, openingHour + 1, closingHour - 2, slotStepMinutes),
                createSchedule(DayOfWeek.SUNDAY, false, null, null, slotStepMinutes)
        );
    }

    private OrganisationScheduleEntity createSchedule(
            DayOfWeek dayOfWeek,
            boolean isWorkingDay,
            Integer openingHour,
            Integer closingHour,
            int slotStepMinutes
    ) {
        OrganisationScheduleEntity schedule = new OrganisationScheduleEntity();
        schedule.setDayOfWeek(dayOfWeek);
        schedule.setIsWorkingDay(isWorkingDay);
        schedule.setStartTime(openingHour == null ? null : LocalTime.of(openingHour, 0));
        schedule.setEndTime(closingHour == null ? null : LocalTime.of(closingHour, 0));
        schedule.setSlotStepMinutes(slotStepMinutes);
        return schedule;
    }
}